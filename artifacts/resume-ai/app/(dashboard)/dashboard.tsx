import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { GlassCard, StartupButton, GradientText } from "@/components/DesignSystem";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DashboardHome() {
  const colors = useColors();
  const router = useRouter();

  const stats = [
    { label: "Total Resumes", value: "12", icon: "file-text", color: "#6366F1" },
    { label: "ATS Avg Score", value: "84", icon: "activity", color: "#10B981" },
    { label: "Jobs Matched", value: "28", icon: "briefcase", color: "#F59E0B" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.welcomeSection}>
        <View>
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
            Welcome back, <Text style={{ color: colors.primary }}>Nisarg!</Text> 👋
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
            Your resumes are looking great. You have 3 new job matches today.
          </Text>
        </View>
        <StartupButton 
          title="Create New Resume" 
          icon={<Feather name="plus" size={18} color="white" />}
          onPress={() => router.push("/resume-builder")}
          style={styles.createButton}
        />
      </Animated.View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <Animated.View 
            key={stat.label} 
            entering={FadeInDown.delay(index * 100).duration(600)}
            style={styles.statWrapper}
          >
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
                <Feather name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <View>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>

      {/* Recent Resumes & Quick Actions */}
      <View style={styles.contentGrid}>
        <View style={styles.mainGridColumn}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Resumes</Text>
          <GlassCard style={styles.resumesCard}>
            <ResumeItem title="Senior Software Engineer" date="2 days ago" score={92} />
            <ResumeItem title="Product Designer" date="1 week ago" score={78} />
            <ResumeItem title="Frontend Developer" date="2 weeks ago" score={85} />
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>View all resumes</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        <View style={styles.sideGridColumn}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Suggestions</Text>
          <GlassCard style={styles.suggestionsCard}>
            <SuggestionItem 
              icon="zap" 
              title="Optimize for Google" 
              desc="Your resume is a 75% match for Google's latest SE role."
            />
            <SuggestionItem 
              icon="edit-3" 
              title="Update Skills" 
              desc="Add 'React Native' to your skills to increase visibility."
            />
          </GlassCard>

          <TouchableOpacity 
            style={[styles.premiumCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/pricing")}
          >
            <View style={styles.premiumContent}>
              <Text style={styles.premiumTitle}>Upgrade to Pro</Text>
              <Text style={styles.premiumDesc}>Get unlimited resumes and advanced ATS insights.</Text>
            </View>
            <Feather name="arrow-right" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function ResumeItem({ title, date, score }: { title: string, date: string, score: number }) {
  const colors = useColors();
  return (
    <View style={[styles.resumeItem, { borderBottomColor: colors.border }]}>
      <View style={styles.resumeInfo}>
        <View style={[styles.resumeIcon, { backgroundColor: colors.muted }]}>
          <Feather name="file-text" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.resumeTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.resumeDate, { color: colors.mutedForeground }]}>{date}</Text>
        </View>
      </View>
      <View style={styles.resumeScore}>
        <Text style={[styles.scoreText, { color: colors.success }]}>{score}%</Text>
        <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Score</Text>
      </View>
    </View>
  );
}

function SuggestionItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  const colors = useColors();
  return (
    <View style={styles.suggestionItem}>
      <View style={[styles.suggestionIcon, { backgroundColor: colors.selection }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.suggestionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.suggestionDesc, { color: colors.mutedForeground }]}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
  },
  welcomeSection: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    justifyContent: "space-between",
    alignItems: Platform.OS === "web" ? "center" : "flex-start",
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
  },
  createButton: {
    marginTop: Platform.OS === "web" ? 0 : 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -12,
    marginBottom: 40,
  },
  statWrapper: {
    flex: 1,
    minWidth: Platform.OS === "web" ? 200 : "100%",
    padding: 12,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  contentGrid: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 32,
  },
  mainGridColumn: {
    flex: 2,
  },
  sideGridColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  resumesCard: {
    padding: 0,
    borderRadius: 24,
  },
  resumeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  resumeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  resumeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  resumeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  resumeDate: {
    fontSize: 13,
  },
  resumeScore: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  viewAllButton: {
    padding: 16,
    alignItems: "center",
  },
  suggestionsCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  suggestionItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  premiumCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  premiumContent: {
    flex: 1,
    marginRight: 16,
  },
  premiumTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  premiumDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
  },
});
