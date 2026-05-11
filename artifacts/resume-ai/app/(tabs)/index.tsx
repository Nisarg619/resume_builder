import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth, FREE_RESUME_LIMIT, FREE_COVER_LETTER_LIMIT } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { AnimatedCard } from "@/components/AnimatedCard";
import { StyledButton } from "@/components/StyledButton";
import { UsageBar } from "@/components/UsageBar";
import { PremiumModal } from "@/components/PremiumModal";
import { ProBadge } from "@/components/ProBadge";
import { Skeleton } from "@/components/Skeleton";
import { useListResumes, useListCoverLetters } from "@workspace/api-client-react";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [proModalVisible, setProModalVisible] = useState(false);

  const { data: resumes, isLoading: rLoading } = useListResumes();
  const { data: coverLetters, isLoading: lLoading } = useListCoverLetters();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const recentResumes = (resumes || []).slice(0, 3);
  const recentCoverLetters = (coverLetters || []).slice(0, 2);

  const handleNewResume = () => {
    if (profile?.plan === "free" && (profile.usageResumeCount ?? 0) >= FREE_RESUME_LIMIT) {
      setProModalVisible(true);
      return;
    }
    router.push("/resume-builder");
  };

  const handleNewCoverLetter = () => {
    if (profile?.plan === "free" && (profile.usageCoverLetterCount ?? 0) >= FREE_COVER_LETTER_LIMIT) {
      setProModalVisible(true);
      return;
    }
    router.push("/cover-letter");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Good {getTimeOfDay()}
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {profile?.name || profile?.email?.split("@")[0] || "there"} 👋
          </Text>
        </View>
        <View style={styles.headerRight}>
          {profile?.plan === "pro" ? (
            <ProBadge />
          ) : (
            <TouchableOpacity
              style={[styles.upgradeChip, { backgroundColor: colors.proLight, borderRadius: 20 }]}
              onPress={() => setProModalVisible(true)}
            >
              <Text style={[styles.upgradeChipText, { color: colors.accent }]}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {profile?.plan === "free" && (
        <AnimatedCard index={1} style={{ borderColor: colors.border }}>
          <View style={{ gap: 14 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 4 }]}>Monthly Usage</Text>
            <UsageBar label="Resumes" used={profile.usageResumeCount} limit={FREE_RESUME_LIMIT} />
            <UsageBar label="Cover Letters" used={profile.usageCoverLetterCount} limit={FREE_COVER_LETTER_LIMIT} />
            <TouchableOpacity onPress={() => setProModalVisible(true)} style={{ marginTop: 4 }}>
              <Text style={[styles.upgradeLink, { color: colors.accent }]}>
                Upgrade for unlimited access →
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>
      )}

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Create & Optimize</Text>
        <View style={styles.actionsGrid}>
          <AnimatedCard 
            index={2} 
            noPadding 
            style={styles.actionCardWrapper} 
            onPress={handleNewResume}
          >
            <View style={[styles.actionCard, { backgroundColor: colors.primary }]}>
              <View style={styles.iconCircle}>
                <Feather name="file-text" size={20} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>New Resume</Text>
              <Text style={styles.actionSub}>AI-powered</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard 
            index={3} 
            noPadding 
            style={styles.actionCardWrapper} 
            onPress={handleNewCoverLetter}
          >
            <View style={[styles.actionCard, { backgroundColor: colors.success }]}>
              <View style={styles.iconCircle}>
                <Feather name="mail" size={20} color={colors.success} />
              </View>
              <Text style={styles.actionTitle}>Cover Letter</Text>
              <Text style={styles.actionSub}>Tailored</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard 
            index={4} 
            noPadding 
            style={styles.actionCardWrapper} 
            onPress={() => router.push("/upload-resume")}
          >
            <View style={[styles.actionCard, { backgroundColor: colors.tint }]}>
              <View style={styles.iconCircle}>
                <Feather name="upload" size={20} color={colors.tint} />
              </View>
              <Text style={styles.actionTitle}>Upload PDF</Text>
              <Text style={styles.actionSub}>ATS Boost</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard 
            index={5} 
            noPadding 
            style={styles.actionCardWrapper} 
            onPress={() => router.push("/ats-analyzer")}
          >
            <View style={[styles.actionCard, { backgroundColor: "#0EA5E9" }]}>
              <View style={styles.iconCircle}>
                <Feather name="target" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.actionTitle}>ATS Scanner</Text>
              <Text style={styles.actionSub}>Score & fix</Text>
            </View>
          </AnimatedCard>
        </View>
      </View>

      <View style={styles.quickActions}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Career Accelerator</Text>
          <View style={[styles.proPill, { backgroundColor: colors.proLight }]}>
            <Text style={[styles.proPillText, { color: colors.pro }]}>PRO</Text>
          </View>
        </View>
        <View style={styles.actionsGrid}>
          <AnimatedCard 
            index={6} 
            noPadding 
            style={styles.actionCardWrapper} 
            onPress={() => {
              if (profile?.plan !== "pro") { setProModalVisible(true); return; }
              router.push("/interview");
            }}
          >
            <View style={[styles.actionCard, { backgroundColor: colors.pro }]}>
              <View style={styles.iconCircle}>
                <Feather name="message-circle" size={20} color={colors.pro} />
              </View>
              <Text style={styles.actionTitle}>Mock Interview</Text>
              <Text style={styles.actionSub}>AI Recruiter</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard 
            index={7} 
            noPadding 
            style={styles.actionCardWrapper} 
            onPress={() => {
              if (profile?.plan !== "pro") { setProModalVisible(true); return; }
              router.push("/roadmap");
            }}
          >
            <View style={[styles.actionCard, { backgroundColor: "#8B5CF6" }]}>
              <View style={styles.iconCircle}>
                <Feather name="map" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.actionTitle}>Career Roadmap</Text>
              <Text style={styles.actionSub}>Skill path</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard 
            index={8} 
            noPadding 
            style={styles.actionCardWrapper} 
            onPress={() => {
              if (profile?.plan !== "pro") { setProModalVisible(true); return; }
              router.push("/linkedin");
            }}
          >
            <View style={[styles.actionCard, { backgroundColor: "#0077B5" }]}>
              <View style={styles.iconCircle}>
                <Feather name="linkedin" size={20} color="#0077B5" />
              </View>
              <Text style={styles.actionTitle}>LinkedIn Opt.</Text>
              <Text style={styles.actionSub}>Profile boost</Text>
            </View>
          </AnimatedCard>
        </View>
      </View>

      {(rLoading || lLoading) ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Documents</Text>
          <View style={{ gap: 8 }}>
            <Skeleton width="100%" height={70} borderRadius={colors.radius} />
            <Skeleton width="100%" height={70} borderRadius={colors.radius} />
          </View>
        </View>
      ) : (
        <>
          {recentResumes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Resumes</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/documents")}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              {recentResumes.map((r, i) => (
                <AnimatedCard
                  key={r.id}
                  index={i + 6}
                  noPadding
                  onPress={() => router.push(`/resume-builder?id=${r.id}`)}
                >
                  <View style={styles.docRow}>
                    <View style={[styles.docIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name="file-text" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={[styles.docTitle, { color: colors.foreground }]}>{r.title}</Text>
                      <Text style={[styles.docDate, { color: colors.mutedForeground }]}>
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}

          {recentResumes.length === 0 && recentCoverLetters.length === 0 && (
            <AnimatedCard index={6} style={{ marginTop: 8 }}>
              <View style={{ alignItems: "center", gap: 12, paddingVertical: 24 }}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
                  <Feather name="file-plus" size={32} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No documents yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Create your first AI-powered resume to get started
                </Text>
                <StyledButton 
                  title="Create Resume" 
                  onPress={handleNewResume} 
                  style={{ marginTop: 8 }} 
                  fullWidth
                />
              </View>
            </AnimatedCard>
          )}
        </>
      )}

      <PremiumModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
        onSuccess={() => setProModalVisible(false)}
      />
    </ScrollView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerRight: { alignItems: "flex-end", gap: 8 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  upgradeChip: { paddingHorizontal: 14, paddingVertical: 6 },
  upgradeChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  quickActions: { gap: 0 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCardWrapper: { width: "47.5%", marginVertical: 0 },
  actionCard: {
    padding: 20,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  actionSub: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  section: { gap: 4 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  docDate: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  upgradeLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  proPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 10 },
  proPillText: { fontSize: 10, fontFamily: "Inter_700Bold" },
});

