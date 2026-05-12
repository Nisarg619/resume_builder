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
  LayoutAnimation,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { Card } from "@/components/Card";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import * as Haptics from "expo-haptics";
import { getApiBaseUrl } from "@/lib/baseUrl";

interface Question {
  question: string;
  idealAnswer: string;
}

export default function InterviewPrepScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  React.useEffect(() => {
    if (profile && profile.plan !== "pro") {
      router.replace("/(tabs)");
      Alert.alert("Pro Feature", "Interview Preparation is available only for Pro members.");
    }
  }, [profile]);

  const generate = async () => {
    if (!jobTitle || !jobDescription) {
      Alert.alert("Missing info", "Please enter job title and description.");
      return;
    }
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${base}/api/ai/interview-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ jobTitle, jobDescription }),
      });
      const result = await res.json() as { questions: Question[] };
      setQuestions(result.questions || []);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === idx ? null : idx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const inputStyle = [styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius - 4 }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Interview Prep</Text>
        <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Job Title</Text>
          <TextInput
            style={inputStyle}
            placeholder="Senior Software Engineer"
            placeholderTextColor={colors.mutedForeground}
            value={jobTitle}
            onChangeText={setJobTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Job Description</Text>
          <TextInput
            style={[inputStyle, styles.textarea]}
            placeholder="Paste the job description..."
            placeholderTextColor={colors.mutedForeground}
            value={jobDescription}
            onChangeText={setJobDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <StyledButton
          title="Generate 10 Interview Questions"
          onPress={generate}
          icon={<Feather name="zap" size={16} color="#fff" />}
          fullWidth
        />

        {questions.length > 0 && (
          <View style={styles.questionsList}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {questions.length} Interview Questions
            </Text>
            {questions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.questionCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: expanded === i ? colors.primary : colors.border }]}
                onPress={() => toggle(i)}
                activeOpacity={0.85}
              >
                <View style={styles.questionHeader}>
                  <View style={[styles.qNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.qNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.questionText, { color: colors.foreground }]}>{q.question}</Text>
                  <Feather name={expanded === i ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </View>
                {expanded === i && (
                  <View style={[styles.answerBox, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
                    <Text style={[styles.answerLabel, { color: colors.primary }]}>Ideal Answer Framework</Text>
                    <Text style={[styles.answerText, { color: colors.foreground }]}>{q.idealAnswer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="Generating interview questions..." />
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
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1.5, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 120 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  questionsList: { gap: 10 },
  questionCard: { padding: 16, borderWidth: 1.5, gap: 12 },
  questionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  qNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  qNumText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  questionText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  answerBox: { padding: 14, gap: 8 },
  answerLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  answerText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
