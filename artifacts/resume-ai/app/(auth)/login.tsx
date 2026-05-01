import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    if (isSignUp && !name.trim()) {
      Alert.alert("Missing name", "Please enter your full name.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        Alert.alert(
          "Account Created!",
          "Check your email to confirm your account, then sign in.",
          [{ text: "OK", onPress: () => setIsSignUp(false) }]
        );
      } else {
        await signInWithEmail(email.trim(), password);
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert("Error", e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 40 : insets.top + 40;
  const bottomPad = isWeb ? 24 : insets.bottom + 24;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary, borderRadius: 20 }]}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>ResumeAI</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Build resumes that get interviews
          </Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            {isSignUp ? "Create account" : "Welcome back"}
          </Text>

          {isSignUp && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius - 4 }]}
                placeholder="John Smith"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius - 4 }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius - 4 }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isSignUp ? "new-password" : "current-password"}
              returnKeyType="done"
              onSubmitEditing={handleAuth}
            />
          </View>

          <StyledButton
            title={isSignUp ? "Create Account" : "Sign In"}
            onPress={handleAuth}
            loading={loading}
            fullWidth
            style={{ marginTop: 4 }}
          />
        </View>

        <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setLoading(false); }} style={styles.toggle}>
          <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
              {isSignUp ? "Sign in" : "Sign up free"}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  logoArea: { alignItems: "center", gap: 12 },
  logoCircle: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { padding: 20, gap: 16, borderWidth: 1 },
  formTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1.5, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  toggle: { alignItems: "center", paddingVertical: 8 },
  toggleText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
