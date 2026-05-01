import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { Card } from "@/components/Card";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import * as Haptics from "expo-haptics";

interface OptimizeResult {
  atsScore: number;
  missingKeywords: string[];
  suggestions: string[];
}

export default function OptimizerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const analyze = async () => {
    if (!resumeText || !jobDescription) {
      Alert.alert("Missing info", "Please paste both your resume and the job description.");
      return;
    }
    setLoading(true);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${base}/api/ai/optimize-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      if (!res.ok) throw new Error("Failed");
      const r = await res.json() as OptimizeResult;
      setResult(r);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.atsScore >= 75 ? colors.success : result.atsScore >= 50 ? colors.accent : colors.destructive
    : colors.primary;

  const inputStyle = [styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius - 4 }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Resume Optimizer</Text>
        <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {result && (
          <Card elevated style={{ alignItems: "center", gap: 16, paddingVertical: 28 }}>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>ATS Score</Text>
            <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreNum, { color: scoreColor }]}>{result.atsScore}</Text>
              <Text style={[styles.scoreMax, { color: colors.mutedForeground }]}>/100</Text>
            </View>
            <Text style={[styles.scoreFeedback, { color: scoreColor }]}>
              {result.atsScore >= 75 ? "Great match!" : result.atsScore >= 50 ? "Needs improvement" : "Low match"}
            </Text>
          </Card>
        )}

        {result && result.missingKeywords.length > 0 && (
          <Card style={{ gap: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Missing Keywords</Text>
            <View style={styles.keywords}>
              {result.missingKeywords.map((kw, i) => (
                <View key={i} style={[styles.keyword, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                  <Text style={[styles.keywordText, { color: colors.foreground }]}>{kw}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {result && result.suggestions.length > 0 && (
          <Card style={{ gap: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Suggestions</Text>
            {result.suggestions.map((s, i) => (
              <View key={i} style={styles.suggestion}>
                <View style={[styles.suggestDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Paste Your Resume</Text>
          <TextInput
            style={[inputStyle, styles.bigArea]}
            placeholder="Copy and paste your resume text here..."
            placeholderTextColor={colors.mutedForeground}
            value={resumeText}
            onChangeText={setResumeText}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Job Description</Text>
          <TextInput
            style={[inputStyle, styles.bigArea]}
            placeholder="Paste the job description here..."
            placeholderTextColor={colors.mutedForeground}
            value={jobDescription}
            onChangeText={setJobDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <StyledButton
          title="Analyze with Claude AI"
          onPress={analyze}
          icon={<Feather name="zap" size={16} color="#fff" />}
          fullWidth
        />
      </ScrollView>

      <LoadingOverlay visible={loading} message="Analyzing your resume..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  proBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  proBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  scroll: { padding: 20, gap: 16 },
  scoreLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 40, fontFamily: "Inter_700Bold" },
  scoreMax: { fontSize: 14, fontFamily: "Inter_400Regular" },
  scoreFeedback: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  keywords: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  keyword: { paddingHorizontal: 12, paddingVertical: 6 },
  keywordText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  suggestion: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  suggestDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  suggestionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1.5, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  bigArea: { minHeight: 160 },
});
