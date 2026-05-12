import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { GlassCard, StartupButton, GradientText } from "@/components/DesignSystem";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

export default function OnboardingScreen() {
  const colors = useColors();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    role: "",
    experience: "",
    goals: "",
  });

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else router.replace("/(dashboard)/dashboard-home");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <View 
                key={s} 
                style={[
                  styles.progressDot, 
                  { backgroundColor: s <= step ? colors.primary : colors.border }
                ]} 
              />
            ))}
          </View>

          {step === 1 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.step}>
              <GradientText text="Welcome aboard!" style={styles.title} />
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Let's start by getting to know your current professional role.
              </Text>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                placeholder="e.g. Senior Software Engineer"
                placeholderTextColor={colors.mutedForeground}
                value={data.role}
                onChangeText={(t) => setData({...data, role: t})}
              />
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.step}>
              <Text style={[styles.stepLabel, { color: colors.primary }]}>Experience</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>Years of Experience?</Text>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                placeholder="e.g. 5 years"
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
                value={data.experience}
                onChangeText={(t) => setData({...data, experience: t})}
              />
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.step}>
              <Text style={[styles.stepLabel, { color: colors.primary }]}>Final Step</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>What's your main goal?</Text>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input, height: 120 }]}
                placeholder="e.g. Land a job at a FAANG company"
                multiline
                placeholderTextColor={colors.mutedForeground}
                value={data.goals}
                onChangeText={(t) => setData({...data, goals: t})}
              />
            </Animated.View>
          )}

          <StartupButton 
            title={step === 3 ? "Complete Profile" : "Continue"} 
            onPress={nextStep}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { maxWidth: 500, alignSelf: "center", width: "100%" },
  progressContainer: { flexDirection: "row", gap: 8, marginBottom: 40 },
  progressDot: { height: 4, flex: 1, borderRadius: 2 },
  step: { gap: 16, marginBottom: 32 },
  stepLabel: { fontSize: 14, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { fontSize: 16, lineHeight: 24 },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: { width: "100%" },
});
