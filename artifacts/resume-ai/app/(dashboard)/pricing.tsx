import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { GlassCard, StartupButton, GradientText } from "@/components/DesignSystem";
import { Feather } from "@expo/vector-icons";

export default function PricingScreen() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <GradientText text="Simple, transparent pricing" style={styles.title} />
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose the plan that's right for your career stage.
        </Text>
      </View>

      <View style={[styles.grid, isWeb && styles.webGrid]}>
        <PricingCard 
          title="Free"
          price="$0"
          description="Perfect for getting started."
          features={[
            "1 Active Resume",
            "3 AI Generations / month",
            "Standard Templates",
            "PDF Export"
          ]}
          buttonText="Current Plan"
          variant="secondary"
        />

        <PricingCard 
          title="Pro"
          price="$12"
          period="/month"
          description="For serious job seekers."
          features={[
            "Unlimited Resumes",
            "Unlimited AI Generations",
            "ATS Keyword Analysis",
            "Premium Templates",
            "Priority Support",
            "Cover Letter Generator"
          ]}
          buttonText="Upgrade to Pro"
          variant="primary"
          highlight
        />
      </View>
    </ScrollView>
  );
}

function PricingCard({ title, price, period, description, features, buttonText, variant, highlight }: any) {
  const colors = useColors();
  return (
    <GlassCard style={[styles.card, highlight && { borderColor: colors.primary, borderWidth: 2 }]}>
      {highlight && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>MOST POPULAR</Text>
        </View>
      )}
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: colors.foreground }]}>{price}</Text>
        {period && <Text style={[styles.period, { color: colors.mutedForeground }]}>{period}</Text>}
      </View>
      <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{description}</Text>
      
      <View style={styles.features}>
        {features.map((f: string, i: number) => (
          <View key={i} style={styles.featureRow}>
            <Feather name="check" size={16} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
          </View>
        ))}
      </View>

      <StartupButton 
        title={buttonText} 
        variant={variant} 
        onPress={() => {}} 
        style={styles.cardButton}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { padding: 40, alignItems: "center" },
  header: { alignItems: "center", marginBottom: 60, gap: 16 },
  title: { fontSize: 40, textAlign: "center" },
  subtitle: { fontSize: 18, textAlign: "center", maxWidth: 600 },
  grid: { gap: 24, width: "100%", maxWidth: 1000 },
  webGrid: { flexDirection: "row", justifyContent: "center" },
  card: { flex: 1, padding: 32, gap: 24, minWidth: 300, position: "relative" },
  badge: {
    position: "absolute",
    top: -12,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  cardTitle: { fontSize: 24, fontWeight: "bold" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  price: { fontSize: 48, fontWeight: "bold" },
  period: { fontSize: 18 },
  cardDesc: { fontSize: 16 },
  features: { gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { fontSize: 14 },
  cardButton: { width: "100%", marginTop: 12 },
});
