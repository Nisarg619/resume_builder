import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/baseUrl";
import { supabase } from "@/lib/supabase";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Card } from "@/components/Card";

interface LinkedInAnalysis {
  score: number;
  sections: {
    headline: { current: string; suggestion: string; impact: string };
    about: { current: string; suggestion: string; impact: string };
    experience: { feedback: string; missingKeywords: string[] };
    skills: { addedSuggestions: string[] };
  };
  networkingStrategy: string;
}

export default function LinkedInOptimizerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [profileText, setProfileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null);

  const analyzeProfile = async () => {
    if (!profileText.trim()) {
      Alert.alert("Missing Content", "Please paste your LinkedIn profile text (headline, about, and experience).");
      return;
    }
    
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const { data: session } = await supabase.auth.getSession();
      
      const res = await fetch(`${base}/api/ai/linkedin-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({
          profileText,
          resumeData: {}, // Pass active resume
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data);
      } else {
        Alert.alert("Error", data.error || "Failed to analyze profile.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
    >
      <Animated.View entering={FadeInDown}>
        <Text style={[styles.title, { color: colors.foreground }]}>LinkedIn Optimizer</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Compare your LinkedIn profile with your resume and get section-by-section improvements to attract more recruiters.
        </Text>
      </Animated.View>

      {!analysis ? (
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Your LinkedIn Profile Text</Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Copy-paste your Headline, About section, and recent Experience.
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="Paste here..."
              placeholderTextColor={colors.mutedForeground}
              value={profileText}
              onChangeText={setProfileText}
              multiline
              numberOfLines={10}
            />
          </View>
          <StyledButton
            title="Analyze & Optimize"
            onPress={analyzeProfile}
            loading={loading}
            fullWidth
          />
        </View>
      ) : (
        <View style={styles.resultsArea}>
          <TouchableOpacity onPress={() => setAnalysis(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Analyze New Profile</Text>
          </TouchableOpacity>

          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
              <Text style={[styles.scoreValue, { color: colors.primary }]}>{analysis.score}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Profile Score</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Optimization Report</Text>
              <Text style={[styles.scoreDesc, { color: colors.mutedForeground }]}>
                Your profile has good potential. Follow these suggestions to hit 90+.
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Section Recommendations</Text>

          <Card style={styles.analysisCard}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Headline</Text>
            </View>
            <Text style={[styles.currentLabel, { color: colors.mutedForeground }]}>Current: {analysis.sections.headline.current || "None"}</Text>
            <View style={[styles.suggestionBox, { backgroundColor: colors.primary + "10", borderLeftColor: colors.primary }]}>
              <Text style={[styles.suggestionTitle, { color: colors.primary }]}>AI Suggestion:</Text>
              <Text style={[styles.suggestionText, { color: colors.foreground }]}>{analysis.sections.headline.suggestion}</Text>
            </View>
            <Text style={[styles.impactText, { color: colors.success }]}>
              <Feather name="trending-up" size={14} /> {analysis.sections.headline.impact}
            </Text>
          </Card>

          <Card style={styles.analysisCard}>
            <View style={styles.cardHeader}>
              <Feather name="edit-3" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>About Section</Text>
            </View>
            <View style={[styles.suggestionBox, { backgroundColor: colors.primary + "10", borderLeftColor: colors.primary }]}>
              <Text style={[styles.suggestionTitle, { color: colors.primary }]}>Optimized "About":</Text>
              <Text style={[styles.suggestionText, { color: colors.foreground }]}>{analysis.sections.about.suggestion}</Text>
            </View>
          </Card>

          <Card style={styles.analysisCard}>
            <View style={styles.cardHeader}>
              <Feather name="briefcase" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Experience & Keywords</Text>
            </View>
            <Text style={[styles.feedbackText, { color: colors.foreground }]}>{analysis.sections.experience.feedback}</Text>
            <View style={styles.keywordSection}>
              <Text style={[styles.keywordTitle, { color: colors.mutedForeground }]}>Missing Keywords:</Text>
              <View style={styles.tagGroup}>
                {analysis.sections.experience.missingKeywords.map(k => (
                  <View key={k} style={[styles.tag, { backgroundColor: colors.destructive + "15" }]}>
                    <Text style={[styles.tagText, { color: colors.destructive }]}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          <Card style={[styles.strategyCard, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.strategyTitle, { color: colors.primary }]}>Networking Strategy</Text>
            <Text style={[styles.strategyText, { color: colors.foreground }]}>{analysis.networkingStrategy}</Text>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 12 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  input: { borderWidth: 1, padding: 14, borderRadius: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { height: 200, textAlignVertical: "top" },
  resultsArea: { gap: 20 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scoreContainer: { flexDirection: "row", alignItems: "center", gap: 20, paddingVertical: 10 },
  scoreCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 6, alignItems: "center", justifyContent: "center" },
  scoreValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  scoreInfo: { flex: 1, gap: 4 },
  scoreTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scoreDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 10 },
  analysisCard: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  currentLabel: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  suggestionBox: { padding: 12, borderLeftWidth: 4, gap: 6 },
  suggestionTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  suggestionText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  impactText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  feedbackText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  keywordSection: { gap: 8 },
  keywordTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tagGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  strategyCard: { padding: 20, gap: 10 },
  strategyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  strategyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
