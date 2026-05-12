import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Dimensions,
  Platform 
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { GlassCard, GradientText, StartupButton } from "@/components/DesignSystem";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight 
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

export default function LandingPage() {
  const colors = useColors();
  const { session } = useAuth();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.nav}>
          <View style={styles.logoRow}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>R</Text>
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>ResumeAI</Text>
          </View>
          <View style={styles.navLinks}>
            {session ? (
              <StartupButton 
                title="Go to Dashboard" 
                onPress={() => router.push("/(dashboard)/dashboard-home")}
                style={styles.navButton}
              />
            ) : (
              <>
                <StartupButton 
                  title="Sign In" 
                  variant="outline" 
                  onPress={() => router.push("/login")}
                  style={styles.navButton}
                />
                <StartupButton 
                  title="Get Started" 
                  onPress={() => router.push("/login")}
                  style={styles.navButton}
                />
              </>
            )}
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.duration(800)} style={styles.heroContent}>
            <View style={[styles.badge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Introducing ResumeAI 2.0</Text>
            </View>
            <GradientText text="Build Your Career" style={styles.heroTitle} />
            <GradientText text="with Intelligence" style={styles.heroTitle} />
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              The AI-powered resume builder that optimizes for ATS, generates professional summaries, and lands you 3x more interviews.
            </Text>
            <View style={styles.heroActions}>
              <StartupButton 
                title="Create My Resume" 
                onPress={() => router.push("/login")}
                style={styles.mainCta}
              />
              <StartupButton 
                title="View Templates" 
                variant="secondary"
                onPress={() => {}}
                style={styles.mainCta}
              />
            </View>
          </Animated.View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Animated.View entering={FadeInUp.delay(200)} style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>Features</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Everything you need to succeed</Text>
          </Animated.View>

          <View style={styles.featureGrid}>
            <FeatureCard 
              icon="zap"
              title="AI Generation"
              description="Generate bullet points and summaries based on your experience."
              delay={300}
            />
            <FeatureCard 
              icon="search"
              title="ATS Analysis"
              description="Real-time scoring and keyword optimization for Applicant Tracking Systems."
              delay={400}
            />
            <FeatureCard 
              icon="layout"
              title="Modern Templates"
              description="Choose from over 20+ professional templates designed for 2024."
              delay={500}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            © 2024 ResumeAI. Built for developers and professionals.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title, description, delay }: any) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInUp.delay(delay)} style={styles.featureCardWrapper}>
      <GlassCard style={styles.featureCard}>
        <View style={[styles.featureIcon, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{description}</Text>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isWeb ? 60 : 20,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  logoText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  appName: { fontSize: 20, fontWeight: "bold" },
  navLinks: { flexDirection: "row", gap: 12 },
  navButton: { minHeight: 40, borderRadius: 8 },
  hero: {
    paddingTop: 80,
    paddingBottom: 120,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroContent: {
    maxWidth: 800,
    alignItems: "center",
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  badgeText: { fontSize: 13, fontWeight: "600" },
  heroTitle: {
    fontSize: isWeb ? 72 : 42,
    textAlign: "center",
    lineHeight: isWeb ? 80 : 48,
  },
  heroSub: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 28,
    maxWidth: 600,
  },
  heroActions: {
    flexDirection: isWeb ? "row" : "column",
    marginTop: 40,
    gap: 16,
    width: isWeb ? "auto" : "100%",
  },
  mainCta: {
    minWidth: 200,
  },
  section: {
    paddingVertical: 100,
    paddingHorizontal: isWeb ? 60 : 20,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 60,
  },
  sectionLabel: { fontSize: 14, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 },
  sectionTitle: { fontSize: 32, fontWeight: "bold", textAlign: "center" },
  featureGrid: {
    flexDirection: isWeb ? "row" : "column",
    gap: 24,
  },
  featureCardWrapper: { flex: 1 },
  featureCard: { padding: 32, gap: 16, height: "100%" },
  featureIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  featureTitle: { fontSize: 20, fontWeight: "700" },
  featureDesc: { fontSize: 16, lineHeight: 24 },
  footer: {
    paddingVertical: 60,
    alignItems: "center",
    borderTopWidth: 1,
  },
  footerText: { fontSize: 14 },
});
