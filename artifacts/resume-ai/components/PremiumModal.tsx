import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "./StyledButton";
import { useAuth } from "@/context/AuthContext";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRO_FEATURES = [
  "Unlimited resume exports",
  "Unlimited cover letters",
  "Resume Optimizer with ATS score",
  "LinkedIn Summary Generator",
  "Interview Question Generator",
  "No ads",
  "Priority Claude AI processing",
];

export function PremiumModal({ visible, onClose, onSuccess }: PremiumModalProps) {
  const colors = useColors();
  const { refreshProfile } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";

      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const orderRes = await fetch(`${base}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (!orderRes.ok) {
        Alert.alert("Error", "Failed to create payment order. Please try again.");
        return;
      }

      const order = await orderRes.json() as { orderId: string; amount: number; currency: string; keyId: string };

      if (Platform.OS === "web") {
        Alert.alert(
          "Payment",
          "Razorpay payments are processed through the mobile app. Please use the iOS or Android app to upgrade.",
        );
        return;
      }

      const RazorpayCheckout = (await import("react-native-razorpay")).default;
      const paymentData = await RazorpayCheckout.open({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "ResumeAI",
        description: plan === "monthly" ? "Pro Monthly Plan" : "Pro Yearly Plan",
        theme: { color: colors.primary },
      });

      const verifyRes = await fetch(`${base}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpayOrderId: paymentData.razorpay_order_id,
          razorpayPaymentId: paymentData.razorpay_payment_id,
          razorpaySignature: paymentData.razorpay_signature,
          plan,
        }),
      });

      if (verifyRes.ok) {
        await refreshProfile();
        Alert.alert("Welcome to Pro!", "Your account has been upgraded. Enjoy all Pro features!");
        onSuccess?.();
        onClose();
      } else {
        Alert.alert("Payment Error", "Payment could not be verified. Contact support.");
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code !== "PAYMENT_CANCELLED") {
        Alert.alert("Payment Failed", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Feather name="x" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.badge, { backgroundColor: colors.proLight }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>ResumeAI Pro</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Unlock Your Career Potential</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Get AI-powered tools to land your dream job faster
          </Text>

          <View style={styles.planRow}>
            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  borderColor: plan === "monthly" ? colors.primary : colors.border,
                  backgroundColor: plan === "monthly" ? colors.secondary : colors.card,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={() => setPlan("monthly")}
            >
              <Text style={[styles.planLabel, { color: colors.foreground }]}>Monthly</Text>
              <Text style={[styles.planPrice, { color: colors.primary }]}>₹99</Text>
              <Text style={[styles.planSub, { color: colors.mutedForeground }]}>per month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  borderColor: plan === "yearly" ? colors.accent : colors.border,
                  backgroundColor: plan === "yearly" ? colors.proLight : colors.card,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={() => setPlan("yearly")}
            >
              <View style={[styles.saveBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.saveText}>SAVE 41%</Text>
              </View>
              <Text style={[styles.planLabel, { color: colors.foreground }]}>Yearly</Text>
              <Text style={[styles.planPrice, { color: colors.accent }]}>₹699</Text>
              <Text style={[styles.planSub, { color: colors.mutedForeground }]}>per year</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.featuresList, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
            {PRO_FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureRow, i < PRO_FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
              </View>
            ))}
          </View>

          <StyledButton
            title={`Upgrade to Pro — ${plan === "monthly" ? "₹99/mo" : "₹699/yr"}`}
            onPress={handleUpgrade}
            variant="pro"
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          />

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Secured by Razorpay. Cancel anytime.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", top: 20, right: 20, zIndex: 10, padding: 4 },
  scroll: { padding: 24, paddingTop: 56, paddingBottom: 48, gap: 20 },
  badge: { alignSelf: "center", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.5 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", lineHeight: 34 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  planRow: { flexDirection: "row", gap: 12 },
  planCard: { flex: 1, padding: 16, borderWidth: 2, alignItems: "center", gap: 4, position: "relative" },
  planLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  planPrice: { fontSize: 28, fontFamily: "Inter_700Bold" },
  planSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  saveBadge: { position: "absolute", top: -10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  saveText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  featuresList: { borderWidth: 1 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  featureText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  disclaimer: { fontSize: 12, textAlign: "center", fontFamily: "Inter_400Regular" },
});
