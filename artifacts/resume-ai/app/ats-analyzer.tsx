import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Platform, Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withDelay, withSpring, Easing, FadeInDown,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import * as Haptics from "expo-haptics";
import { getApiBaseUrl } from "@/lib/baseUrl";
import Svg, { Circle } from "react-native-svg";

// ── Types ───────────────────────────────────────────────────────────
interface ATSResult {
  overallScore: number;
  sectionScores: Record<string, number>;
  keywordAnalysis: { found: string[]; missing: string[]; density: number };
  readability: { score: number; grade: string; feedback: string };
  formatting: { issues: string[]; passed: string[] };
  actionVerbs: { used: string[]; suggested: string[] };
  recommendations: Array<{ category: string; priority: "high" | "medium" | "low"; title: string; description: string }>;
  summary: string;
}

// ── Animated Score Ring ─────────────────────────────────────────────
function ScoreRing({ score, size = 160, strokeWidth = 12, color }: { score: number; size?: number; strokeWidth?: number; color: string }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const progress = useSharedValue(0);
  React.useEffect(() => { progress.value = withTiming(score / 100, { duration: 1400, easing: Easing.out(Easing.cubic) }); }, [score]);
  const animStyle = useAnimatedStyle(() => ({ strokeDashoffset: circ * (1 - progress.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(128,128,128,0.15)" strokeWidth={strokeWidth} fill="none" />
      </Svg>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circ}`} strokeLinecap="round" style={animStyle} />
      </Svg>
      <Text style={[styles.scoreNum, { color }]}>{score}</Text>
      <Text style={[styles.scoreOf, { color: "rgba(128,128,128,0.7)" }]}>/100</Text>
    </View>
  );
}
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Section Score Bar ───────────────────────────────────────────────
function SectionBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const colors = useColors();
  const w = useSharedValue(0);
  React.useEffect(() => { w.value = withDelay(delay, withSpring(value, { damping: 18 })); }, [value]);
  const bar = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[styles.barLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.barVal, { color: colors.mutedForeground }]}>{value}%</Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.barFill, { backgroundColor: color }, bar]} />
      </View>
    </View>
  );
}

// ── Chip ────────────────────────────────────────────────────────────
function Chip({ text, variant, colors: c }: { text: string; variant: "found" | "missing" | "verb" | "suggest"; colors: ReturnType<typeof useColors> }) {
  const bg = variant === "found" ? c.success + "20" : variant === "missing" ? c.destructive + "20" : variant === "verb" ? c.primary + "20" : c.accent + "20";
  const fg = variant === "found" ? c.success : variant === "missing" ? c.destructive : variant === "verb" ? c.primary : c.accent;
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderRadius: 8 }]}>
      <Text style={[styles.chipText, { color: fg }]}>{text}</Text>
    </View>
  );
}

// ── Priority Badge ──────────────────────────────────────────────────
function PriorityBadge({ priority, colors: c }: { priority: string; colors: ReturnType<typeof useColors> }) {
  const bg = priority === "high" ? c.destructive : priority === "medium" ? c.accent : c.success;
  return (
    <View style={[styles.priorityBadge, { backgroundColor: bg + "25", borderRadius: 6 }]}>
      <Text style={[styles.priorityText, { color: bg }]}>{priority.toUpperCase()}</Text>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────
export default function ATSAnalyzerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "results">("input");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const analyze = useCallback(async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      Alert.alert("Too short", "Please paste a more complete resume (50+ characters).");
      return;
    }
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${base}/api/ai/ats-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ resumeText, jobDescription: jobDescription || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      const r = await res.json() as ATSResult;
      setResult(r);
      setActiveTab("results");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ title: "Analysis Complete!", message: `Your ATS score: ${r.overallScore}/100`, type: r.overallScore >= 70 ? "success" : "info" });
    } catch {
      showToast({ title: "Analysis Failed", message: "Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [resumeText, jobDescription]);

  const scoreColor = result
    ? result.overallScore >= 80 ? colors.success : result.overallScore >= 60 ? colors.accent : colors.destructive
    : colors.primary;

  const sectionLabels: Record<string, string> = {
    contactInfo: "Contact Info", summary: "Summary", experience: "Experience",
    education: "Education", skills: "Skills", formatting: "Formatting",
  };

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input, borderRadius: colors.radius - 4 }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>ATS Analyzer</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>AI-Powered Resume Scanner</Text>
        </View>
        <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
          <Feather name="cpu" size={12} color="#fff" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      {/* Tabs */}
      {result && (
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {(["input", "results"] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <Feather name={tab === "input" ? "edit-3" : "bar-chart-2"} size={16}
                color={activeTab === tab ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
                {tab === "input" ? "Input" : "Results"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {/* ── INPUT TAB ─────────────────────────────────── */}
        {activeTab === "input" && (
          <>
            <Card style={{ gap: 14 }}>
              <View style={styles.fieldHeader}>
                <Feather name="file-text" size={18} color={colors.primary} />
                <Text style={[styles.fieldTitle, { color: colors.foreground }]}>Resume Text</Text>
              </View>
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Paste your resume content below. The AI will analyze it for ATS compatibility.
              </Text>
              <TextInput style={[inputStyle, styles.bigArea]} placeholder="Paste your full resume text here..."
                placeholderTextColor={colors.mutedForeground} value={resumeText}
                onChangeText={setResumeText} multiline textAlignVertical="top" />
              {resumeText.length > 0 && (
                <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                  {resumeText.length} characters
                </Text>
              )}
            </Card>

            <Card style={{ gap: 14 }}>
              <View style={styles.fieldHeader}>
                <Feather name="briefcase" size={18} color={colors.accent} />
                <Text style={[styles.fieldTitle, { color: colors.foreground }]}>Job Description</Text>
                <View style={[styles.optionalBadge, { backgroundColor: colors.muted, borderRadius: 6 }]}>
                  <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>Optional</Text>
                </View>
              </View>
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Add a job description for targeted keyword matching and role-specific analysis.
              </Text>
              <TextInput style={[inputStyle, styles.medArea]} placeholder="Paste job description for targeted analysis..."
                placeholderTextColor={colors.mutedForeground} value={jobDescription}
                onChangeText={setJobDescription} multiline textAlignVertical="top" />
            </Card>

            <StyledButton title="Analyze Resume" onPress={analyze}
              icon={<Feather name="zap" size={16} color="#fff" />} fullWidth loading={loading} />
          </>
        )}

        {/* ── RESULTS TAB ───────────────────────────────── */}
        {activeTab === "results" && result && (
          <>
            {/* Score Hero */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <LinearGradient colors={[scoreColor + "15", colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.scoreCard, { borderColor: colors.glassBorder, borderRadius: colors.radius }]}>
                <ScoreRing score={result.overallScore} color={scoreColor} />
                <Text style={[styles.scoreGrade, { color: scoreColor }]}>
                  {result.overallScore >= 80 ? "Excellent" : result.overallScore >= 60 ? "Good" : result.overallScore >= 40 ? "Fair" : "Needs Work"}
                </Text>
                <Text style={[styles.scoreSummary, { color: colors.mutedForeground }]}>{result.summary}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Section Scores */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <Card style={{ gap: 14 }}>
                <View style={styles.fieldHeader}>
                  <Feather name="bar-chart-2" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Section Breakdown</Text>
                </View>
                {Object.entries(result.sectionScores).map(([key, val], i) => (
                  <SectionBar key={key} label={sectionLabels[key] || key} value={val}
                    color={val >= 75 ? colors.success : val >= 50 ? colors.accent : colors.destructive} delay={i * 80} />
                ))}
              </Card>
            </Animated.View>

            {/* Keywords */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <Card style={{ gap: 14 }}>
                <View style={styles.fieldHeader}>
                  <Feather name="search" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Keyword Analysis</Text>
                  <View style={[styles.densityBadge, { backgroundColor: colors.primary + "20", borderRadius: 8 }]}>
                    <Text style={[styles.densityText, { color: colors.primary }]}>{result.keywordAnalysis.density}% match</Text>
                  </View>
                </View>
                {result.keywordAnalysis.found.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.subLabel, { color: colors.success }]}>✓ Keywords Found</Text>
                    <View style={styles.chipWrap}>
                      {result.keywordAnalysis.found.map((k, i) => <Chip key={i} text={k} variant="found" colors={colors} />)}
                    </View>
                  </View>
                )}
                {result.keywordAnalysis.missing.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.subLabel, { color: colors.destructive }]}>✗ Missing Keywords</Text>
                    <View style={styles.chipWrap}>
                      {result.keywordAnalysis.missing.map((k, i) => <Chip key={i} text={k} variant="missing" colors={colors} />)}
                    </View>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Readability */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Card style={{ gap: 10 }}>
                <View style={styles.fieldHeader}>
                  <Feather name="book-open" size={18} color={colors.tint} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Readability</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View style={[styles.readBadge, { backgroundColor: colors.tint + "18", borderRadius: 12 }]}>
                    <Text style={[styles.readScore, { color: colors.tint }]}>{result.readability.score}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.readGrade, { color: colors.foreground }]}>{result.readability.grade}</Text>
                    <Text style={[styles.readFeedback, { color: colors.mutedForeground }]}>{result.readability.feedback}</Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Formatting */}
            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <Card style={{ gap: 12 }}>
                <View style={styles.fieldHeader}>
                  <Feather name="layout" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Formatting</Text>
                </View>
                {result.formatting.passed.map((p, i) => (
                  <View key={`p${i}`} style={styles.fmtRow}>
                    <Feather name="check-circle" size={16} color={colors.success} />
                    <Text style={[styles.fmtText, { color: colors.foreground }]}>{p}</Text>
                  </View>
                ))}
                {result.formatting.issues.map((p, i) => (
                  <View key={`i${i}`} style={styles.fmtRow}>
                    <Feather name="alert-circle" size={16} color={colors.destructive} />
                    <Text style={[styles.fmtText, { color: colors.foreground }]}>{p}</Text>
                  </View>
                ))}
              </Card>
            </Animated.View>

            {/* Action Verbs */}
            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <Card style={{ gap: 12 }}>
                <View style={styles.fieldHeader}>
                  <Feather name="edit-3" size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Action Verbs</Text>
                </View>
                {result.actionVerbs.used.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.subLabel, { color: colors.primary }]}>Already Using</Text>
                    <View style={styles.chipWrap}>
                      {result.actionVerbs.used.map((v, i) => <Chip key={i} text={v} variant="verb" colors={colors} />)}
                    </View>
                  </View>
                )}
                {result.actionVerbs.suggested.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.subLabel, { color: colors.accent }]}>Try These</Text>
                    <View style={styles.chipWrap}>
                      {result.actionVerbs.suggested.map((v, i) => <Chip key={i} text={v} variant="suggest" colors={colors} />)}
                    </View>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Recommendations */}
            <Animated.View entering={FadeInDown.delay(450).duration(500)}>
              <Card style={{ gap: 14 }}>
                <View style={styles.fieldHeader}>
                  <Feather name="list" size={18} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recommendations</Text>
                </View>
                {result.recommendations.map((rec, i) => (
                  <View key={i} style={[styles.recCard, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <PriorityBadge priority={rec.priority} colors={colors} />
                      <Text style={[styles.recCat, { color: colors.mutedForeground }]}>{rec.category}</Text>
                    </View>
                    <Text style={[styles.recTitle, { color: colors.foreground }]}>{rec.title}</Text>
                    <Text style={[styles.recDesc, { color: colors.mutedForeground }]}>{rec.description}</Text>
                  </View>
                ))}
              </Card>
            </Animated.View>

            {/* Re-analyze */}
            <StyledButton title="Re-analyze" onPress={() => setActiveTab("input")} variant="outline"
              icon={<Feather name="refresh-cw" size={16} color={colors.primary} />} fullWidth />
          </>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="Analyzing your resume with AI..." />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, gap: 2, borderBottomWidth: 1, flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  aiBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 20 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 16 },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldTitle: { fontSize: 16, fontFamily: "Inter_700Bold", flex: 1 },
  fieldHint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  input: { borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  bigArea: { minHeight: 180 },
  medArea: { minHeight: 120 },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  optionalBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  optionalText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  // Score
  scoreCard: { alignItems: "center", gap: 16, padding: 28, borderWidth: 1, overflow: "hidden" },
  scoreNum: { fontSize: 48, fontFamily: "Inter_700Bold" },
  scoreOf: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -4 },
  scoreGrade: { fontSize: 20, fontFamily: "Inter_700Bold" },
  scoreSummary: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "center" },
  // Section bars
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  barLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  barVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  barTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  // Keywords
  densityBadge: { paddingHorizontal: 10, paddingVertical: 4, marginLeft: "auto" },
  densityText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  subLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  // Readability
  readBadge: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  readScore: { fontSize: 22, fontFamily: "Inter_700Bold" },
  readGrade: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  readFeedback: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  // Formatting
  fmtRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  fmtText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  // Recommendations
  recCard: { padding: 14, gap: 4 },
  recCat: { fontSize: 11, fontFamily: "Inter_500Medium" },
  recTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  recDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2 },
  priorityText: { fontSize: 10, fontFamily: "Inter_700Bold" },
});
