import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth, FREE_RESUME_LIMIT, FREE_COVER_LETTER_LIMIT } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { StyledButton } from "@/components/StyledButton";
import { UsageBar } from "@/components/UsageBar";
import { PremiumModal } from "@/components/PremiumModal";
import { ProBadge } from "@/components/ProBadge";
import { useListResumes, useListCoverLetters } from "@workspace/api-client-react";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const [proModalVisible, setProModalVisible] = useState(false);

  const { data: resumes } = useListResumes();
  const { data: coverLetters } = useListCoverLetters();

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
      <View style={styles.header}>
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
      </View>

      {profile?.plan === "free" && (
        <Card style={{ gap: 14, borderColor: colors.border }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Usage</Text>
          <UsageBar label="Resumes" used={profile.usageResumeCount} limit={FREE_RESUME_LIMIT} />
          <UsageBar label="Cover Letters" used={profile.usageCoverLetterCount} limit={FREE_COVER_LETTER_LIMIT} />
          <TouchableOpacity onPress={() => setProModalVisible(true)}>
            <Text style={[styles.upgradeLink, { color: colors.accent }]}>
              Upgrade for unlimited access →
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={handleNewResume}
            activeOpacity={0.85}
          >
            <Feather name="file-text" size={24} color="#fff" />
            <Text style={styles.actionTitle}>New Resume</Text>
            <Text style={styles.actionSub}>Build with AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#1B5E20", borderRadius: colors.radius }]}
            onPress={handleNewCoverLetter}
            activeOpacity={0.85}
          >
            <Feather name="mail" size={24} color="#fff" />
            <Text style={styles.actionTitle}>Cover Letter</Text>
            <Text style={styles.actionSub}>AI-tailored</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#01579B", borderRadius: colors.radius }]}
            onPress={() => router.push("/upload-resume")}
            activeOpacity={0.85}
          >
            <Feather name="upload" size={24} color="#fff" />
            <Text style={styles.actionTitle}>Upload PDF</Text>
            <Text style={styles.actionSub}>95%+ ATS boost</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: profile?.plan === "pro" ? "#4A148C" : colors.muted,
              borderRadius: colors.radius,
            }]}
            onPress={() => {
              if (profile?.plan !== "pro") { setProModalVisible(true); return; }
              router.push("/optimizer");
            }}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={24} color={profile?.plan === "pro" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.actionTitle, profile?.plan !== "pro" && { color: colors.mutedForeground }]}>Optimizer</Text>
            <Text style={[styles.actionSub, profile?.plan !== "pro" && { color: colors.mutedForeground }]}>Pro only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: profile?.plan === "pro" ? "#E65100" : colors.muted,
              borderRadius: colors.radius,
            }]}
            onPress={() => {
              if (profile?.plan !== "pro") { setProModalVisible(true); return; }
              router.push("/interview-prep");
            }}
            activeOpacity={0.85}
          >
            <Feather name="message-square" size={24} color={profile?.plan === "pro" ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.actionTitle, profile?.plan !== "pro" && { color: colors.mutedForeground }]}>Interview</Text>
            <Text style={[styles.actionSub, profile?.plan !== "pro" && { color: colors.mutedForeground }]}>Pro only</Text>
          </TouchableOpacity>
        </View>
      </View>

      {recentResumes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Resumes</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/documents")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentResumes.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.docRow, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}
              onPress={() => router.push(`/resume-builder?id=${r.id}`)}
              activeOpacity={0.8}
            >
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
            </TouchableOpacity>
          ))}
        </View>
      )}

      {recentCoverLetters.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Cover Letters</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/documents")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentCoverLetters.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[styles.docRow, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}
              onPress={() => router.push(`/cover-letter?id=${l.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.docIcon, { backgroundColor: "#E8F5E9" }]}>
                <Feather name="mail" size={18} color="#1B5E20" />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: colors.foreground }]}>{l.title}</Text>
                <Text style={[styles.docDate, { color: colors.mutedForeground }]}>
                  {l.companyName || "Draft"} · {new Date(l.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {recentResumes.length === 0 && recentCoverLetters.length === 0 && (
        <Card style={{ alignItems: "center", gap: 12, paddingVertical: 40 }}>
          <Feather name="inbox" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No documents yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Create your first AI-powered resume to get started
          </Text>
          <StyledButton title="Create Resume" onPress={handleNewResume} style={{ marginTop: 8 }} />
        </Card>
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
  actionCard: {
    width: "47.5%",
    padding: 20,
    gap: 8,
  },
  actionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  actionSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  section: { gap: 0 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  docIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  docDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  upgradeLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
