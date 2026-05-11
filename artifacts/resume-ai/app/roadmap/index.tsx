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
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Card } from "@/components/Card";

interface Milestone {
  title: string;
  description: string;
  skillsToLearn: string[];
  recommendedProjects: string[];
  estimatedMonths: number;
}

interface RoadmapData {
  targetRole: string;
  timeline: string;
  milestones: Milestone[];
  overallStrategy: string;
}

export default function CareerRoadmapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);

  const generateRoadmap = async () => {
    if (!targetRole.trim()) {
      Alert.alert("Missing Role", "Please enter the role you're aiming for.");
      return;
    }
    
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const { data: session } = await supabase.auth.getSession();
      
      const res = await fetch(`${base}/api/ai/career-roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({
          targetRole,
          resumeData: {}, // In real app, pass active resume
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setRoadmap(data);
      } else {
        Alert.alert("Error", data.error || "Failed to generate roadmap.");
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
        <Text style={[styles.title, { color: colors.foreground }]}>AI Career Roadmap</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Visualize your path to your dream role. We'll map out the skills, projects, and milestones you need.
        </Text>
      </Animated.View>

      {!roadmap ? (
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>What's your dream role?</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="e.g. Staff Engineer, Product Lead, CTO"
              placeholderTextColor={colors.mutedForeground}
              value={targetRole}
              onChangeText={setTargetRole}
            />
          </View>
          <StyledButton
            title="Generate My Roadmap"
            onPress={generateRoadmap}
            loading={loading}
            fullWidth
          />
        </View>
      ) : (
        <View style={styles.roadmapArea}>
          <TouchableOpacity onPress={() => setRoadmap(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Change Target Role</Text>
          </TouchableOpacity>

          <Card style={[styles.strategyCard, { borderColor: colors.primary + "30" }]}>
            <Text style={[styles.strategyTitle, { color: colors.primary }]}>Overall Strategy</Text>
            <Text style={[styles.strategyText, { color: colors.foreground }]}>{roadmap.overallStrategy}</Text>
            <View style={[styles.timelineBadge, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="clock" size={14} color={colors.primary} />
              <Text style={[styles.timelineText, { color: colors.primary }]}>Est. Timeline: {roadmap.timeline}</Text>
            </View>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Milestones</Text>
          
          <View style={styles.milestoneList}>
            {roadmap.milestones.map((m, i) => (
              <Animated.View key={i} entering={FadeInRight.delay(i * 200)} style={styles.milestoneContainer}>
                <View style={styles.milestoneLeft}>
                  <View style={[styles.milestoneDot, { backgroundColor: colors.primary }]} />
                  {i < roadmap.milestones.length - 1 && <View style={[styles.milestoneLine, { backgroundColor: colors.border }]} />}
                </View>
                <View style={styles.milestoneRight}>
                  <Card style={styles.milestoneCard}>
                    <View style={styles.milestoneHeader}>
                      <Text style={[styles.milestoneTitle, { color: colors.foreground }]}>{m.title}</Text>
                      <Text style={[styles.milestoneTime, { color: colors.mutedForeground }]}>{m.estimatedMonths}mo</Text>
                    </View>
                    <Text style={[styles.milestoneDesc, { color: colors.mutedForeground }]}>{m.description}</Text>
                    
                    <View style={styles.tagGroup}>
                      {m.skillsToLearn.map(s => (
                        <View key={s} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>{s}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.projectSection}>
                      <Text style={[styles.projectLabel, { color: colors.foreground }]}>Recommended Projects:</Text>
                      {m.recommendedProjects.map(p => (
                        <View key={p} style={styles.projectItem}>
                          <Feather name="code" size={14} color={colors.primary} />
                          <Text style={[styles.projectText, { color: colors.mutedForeground }]}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>
              </Animated.View>
            ))}
          </View>
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
  form: { gap: 20, marginTop: 10 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, padding: 14, borderRadius: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  roadmapArea: { gap: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  strategyCard: { padding: 20, gap: 12, borderWidth: 1 },
  strategyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  strategyText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  timelineBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timelineText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 8 },
  milestoneList: { gap: 0 },
  milestoneContainer: { flexDirection: "row", minHeight: 120 },
  milestoneLeft: { alignItems: "center", width: 30 },
  milestoneDot: { width: 12, height: 12, borderRadius: 6, zIndex: 2 },
  milestoneLine: { flex: 1, width: 2, marginVertical: 4 },
  milestoneRight: { flex: 1, paddingBottom: 24, paddingLeft: 10 },
  milestoneCard: { padding: 16, gap: 12 },
  milestoneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  milestoneTitle: { fontSize: 16, fontFamily: "Inter_700Bold", flex: 1 },
  milestoneTime: { fontSize: 12, fontFamily: "Inter_500Medium" },
  milestoneDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  tagGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  projectSection: { gap: 8, marginTop: 4 },
  projectLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  projectItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  projectText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});
