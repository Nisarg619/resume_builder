import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import { Platform, AppState } from "react-native";
import * as Linking from "expo-linking";
import { getApiBaseUrl } from "@/lib/baseUrl";

WebBrowser.maybeCompleteAuthSession();

// ── Types ───────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "free" | "pro";
  usageResumeCount: number;
  usageCoverLetterCount: number;
  subscriptionExpiresAt: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const FREE_RESUME_LIMIT = 3;
const FREE_COVER_LETTER_LIMIT = 3;

// ── Human-readable error mapper ─────────────────────────────────────
function mapAuthError(error: AuthError | Error): string {
  const msg = error.message.toLowerCase();
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials"))
    return "Incorrect email or password. Please try again.";
  if (msg.includes("user already registered") || msg.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (msg.includes("email not confirmed"))
    return "Please verify your email before signing in. Check your inbox.";
  if (msg.includes("signup is disabled"))
    return "Sign-up is currently disabled. Please contact support.";
  if (msg.includes("rate limit") || msg.includes("too many requests"))
    return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("password") && (msg.includes("short") || msg.includes("weak") || msg.includes("at least")))
    return "Password is too short. Please use at least 6 characters.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Network error. Please check your connection and try again.";
  if (msg.includes("email"))
    return "Please enter a valid email address.";
  return error.message || "Something went wrong. Please try again.";
}

// ── Backend sync ────────────────────────────────────────────────────
async function syncUserWithBackend(token: string): Promise<UserProfile | null> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<UserProfile>;
  } catch {
    return null;
  }
}

function getWebRedirectUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/`;
}

// ── Provider ────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const syncingRef = useRef(false);

  // Sync profile helper with dedup
  const syncProfile = useCallback(async (accessToken: string) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const p = await syncUserWithBackend(accessToken);
      setProfile(p);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      await syncProfile(data.session.access_token);
    }
  }, [syncProfile]);

  // ── Initial session restore + auth listener ───────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        await syncProfile(s.access_token);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (s?.access_token) {
        // Only sync on meaningful events
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          await syncProfile(s.access_token);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  // ── Auto-refresh session when app comes to foreground ─────────────
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, []);

  // ── Auth methods ──────────────────────────────────────────────────
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw new Error(mapAuthError(error));
    // Supabase returns a user with identities=[] when email already exists
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error("An account with this email already exists. Try signing in instead.");
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === "web") {
      const redirectTo = getWebRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: false },
      });
      if (error) throw new Error(mapAuthError(error));
      if (data?.url) {
        window.location.href = data.url;
      }
    } else {
      const redirectTo = Linking.createURL("/");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw new Error(mapAuthError(error));
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === "success" && result.url) {
          try {
            const url = new URL(result.url);
            const code = url.searchParams.get("code");
            if (code) {
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeError) throw new Error(mapAuthError(exchangeError));
            }
          } catch (e) {
            console.error("URL parsing error", e);
          }
        }
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    setProfile(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = Platform.OS === "web" ? `${getWebRedirectUrl()}(auth)/reset-password` : Linking.createURL("/(auth)/reset-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      signInWithEmail, signUpWithEmail, signInWithGoogle,
      signOut, refreshProfile, resetPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { FREE_RESUME_LIMIT, FREE_COVER_LETTER_LIMIT };
