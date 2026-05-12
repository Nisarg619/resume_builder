import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown, FadeInUp, FadeInRight } from "react-native-reanimated";

type AuthMode = "login" | "signup" | "forgot";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const { showToast } = useToast();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [emailVerifySent, setEmailVerifySent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isWeb = Platform.OS === "web";
  const safeTop = insets?.top ?? 0;
  const safeBottom = insets?.bottom ?? 0;
  const topPad = isWeb ? 40 : safeTop + 40;
  const bottomPad = isWeb ? 24 : safeBottom + 24;

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input, borderRadius: colors.radius - 4 }];

  const handleAuth = async () => {
    if (mode === "forgot") {
      if (!email.trim()) { showToast({ title: "Missing Email", message: "Enter your email to reset password.", type: "error" }); return; }
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setResetSent(true);
        showToast({ title: "Reset Email Sent!", message: "Check your inbox for the reset link.", type: "success" });
      } catch (err: unknown) {
        showToast({ title: "Error", message: (err as Error).message, type: "error" });
      } finally { setLoading(false); }
      return;
    }

    if (!email.trim() || !password.trim()) { showToast({ title: "Missing Fields", message: "Please enter email and password.", type: "error" }); return; }
    if (mode === "signup" && !name.trim()) { showToast({ title: "Missing Name", message: "Please enter your full name.", type: "error" }); return; }
    if (password.length < 6) { showToast({ title: "Weak Password", message: "Password must be at least 6 characters.", type: "error" }); return; }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name.trim());
        setEmailVerifySent(true);
        showToast({ title: "Account Created!", message: "Check your email to verify your account.", type: "success" });
        setMode("login");
        setPassword("");
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: unknown) {
      const message = (err as Error).message;
      showToast({ title: "Authentication Error", message, type: "error" });
    } finally { 
      setLoading(false); 
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      showToast({ title: "Google Sign-In Failed", message: (err as Error).message, type: "error" });
    } finally { setGoogleLoading(false); }
  };

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setLoading(false);
    setGoogleLoading(false);
    setResetSent(false);
    setEmailVerifySent(false);
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary, borderRadius: 24, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }]}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>ResumeAI</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Build resumes that get interviews</Text>
        </Animated.View>

        {/* Email verification banner */}
        {emailVerifySent && (
          <Animated.View entering={FadeInUp} style={[styles.banner, { backgroundColor: colors.success + "15", borderColor: colors.success + "40", borderRadius: colors.radius }]}>
            <Feather name="mail" size={20} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.success }]}>Verification Email Sent</Text>
              <Text style={[styles.bannerText, { color: colors.foreground }]}>
                Please check your inbox and click the verification link before signing in.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Form */}
        <Animated.View entering={FadeInUp.delay(300).duration(800)} style={{ borderRadius: colors.radius, overflow: "hidden", marginTop: 10 }}>
          <BlurView
            tint={colors.background === "#020617" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
            intensity={80}
            style={[styles.form, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
          >
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              {mode === "forgot" ? "Reset Password" : mode === "signup" ? "Create account" : "Welcome back"}
            </Text>

            {mode === "forgot" && resetSent && (
              <View style={[styles.inlineBanner, { backgroundColor: colors.success + "12", borderRadius: colors.radius - 4 }]}>
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text style={[styles.inlineBannerText, { color: colors.foreground }]}>
                  Reset link sent! Check your email and follow the instructions.
                </Text>
              </View>
            )}

            {/* Google (not on forgot) */}
            {mode !== "forgot" && (
              <>
                <StyledButton title={googleLoading ? "Connecting..." : "Continue with Google"}
                  onPress={handleGoogle} loading={googleLoading} fullWidth variant="outline" style={{ marginBottom: 4 }} />
                <View style={styles.dividerRow}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>
              </>
            )}

            {/* Name (signup only) */}
            {mode === "signup" && (
              <Animated.View entering={FadeInRight} style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
                <TextInput style={inputStyle} placeholder="John Smith" placeholderTextColor={colors.mutedForeground}
                  value={name} onChangeText={setName} autoCapitalize="words" />
              </Animated.View>
            )}

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <TextInput style={inputStyle} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground}
                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            </View>

            {/* Password (not on forgot) */}
            {mode !== "forgot" && (
              <View style={styles.field}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                  {mode === "login" && (
                    <TouchableOpacity onPress={() => switchMode("forgot")}>
                      <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ position: "relative" }}>
                  <TextInput style={[inputStyle, { paddingRight: 48 }]} placeholder="Min. 6 characters"
                    placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword}
                    secureTextEntry={!showPassword} autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    returnKeyType="done" onSubmitEditing={handleAuth} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit */}
            <StyledButton
              title={mode === "forgot" ? (resetSent ? "Resend Email" : "Send Reset Link")
                : mode === "signup" ? "Create Account" : "Sign In"}
              onPress={handleAuth} loading={loading} fullWidth style={{ marginTop: 8 }} />
          </BlurView>
        </Animated.View>

        {/* Mode switchers */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.toggleArea}>
          {mode === "forgot" ? (
            <TouchableOpacity onPress={() => switchMode("login")} style={styles.toggle}>
              <Feather name="arrow-left" size={14} color={colors.primary} />
              <Text style={[styles.toggleText, { color: colors.primary }]}>Back to Sign In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => switchMode(mode === "login" ? "signup" : "login")} style={styles.toggle}>
              <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                  {mode === "signup" ? "Sign in" : "Sign up free"}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 16 },
  logoArea: { alignItems: "center", gap: 12 },
  logoCircle: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  banner: { flexDirection: "row", padding: 14, gap: 12, borderWidth: 1, alignItems: "flex-start" },
  bannerTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  bannerText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  form: { padding: 24, gap: 16, borderWidth: 1 },
  formTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4, textAlign: "center" },
  inlineBanner: { flexDirection: "row", padding: 12, gap: 10, alignItems: "center" },
  inlineBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  forgotText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center", width: 24 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  toggleArea: { alignItems: "center", paddingVertical: 4 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  toggleText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});

