import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

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
}

const AuthContext = createContext<AuthContextType | null>(null);

const FREE_RESUME_LIMIT = 3;
const FREE_COVER_LETTER_LIMIT = 3;

async function syncUserWithBackend(token: string): Promise<UserProfile | null> {
  try {
    const domain = process.env["EXPO_PUBLIC_DOMAIN"];
    const base = domain ? `https://${domain}` : "";
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
  return `${window.location.origin}/`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      const p = await syncUserWithBackend(data.session.access_token);
      setProfile(p);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        const p = await syncUserWithBackend(s.access_token);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        const p = await syncUserWithBackend(s.access_token);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const redirectTo = Platform.OS === "web" ? getWebRedirectUrl() : Linking.createURL("/");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    if (Platform.OS !== "web" && data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success" && result.url) {
        await supabase.auth.exchangeCodeForSession(result.url);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      refreshProfile,
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
