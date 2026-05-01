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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { ProBadge } from "@/components/ProBadge";
import { PremiumModal } from "@/components/PremiumModal";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const [proModalVisible, setProModalVisible] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || "?";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Profile</Text>

      <Card elevated style={{ alignItems: "center", gap: 12, paddingVertical: 28 }}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {profile?.name || "User"}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{profile?.email}</Text>
          {profile?.plan === "pro" ? (
            <ProBadge />
          ) : (
            <View style={[styles.freeBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.freeBadgeText, { color: colors.mutedForeground }]}>Free Plan</Text>
            </View>
          )}
        </View>
      </Card>

      {profile?.plan === "free" && (
        <TouchableOpacity
          style={[styles.upgradeCard, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
          onPress={() => setProModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.upgradeCardContent}>
            <Feather name="zap" size={24} color="#fff" />
            <View>
              <Text style={styles.upgradeCardTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeCardSub}>₹99/mo or ₹699/yr</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {profile?.subscriptionExpiresAt && (
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Feather name="calendar" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Pro expires</Text>
            <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>
              {new Date(profile.subscriptionExpiresAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
        </Card>
      )}

      <View style={[styles.menuSection, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
        {[
          { icon: "file-text" as const, label: "Total Resumes", value: String(profile?.usageResumeCount || 0) },
          { icon: "mail" as const, label: "Total Cover Letters", value: String(profile?.usageCoverLetterCount || 0) },
        ].map((item, i) => (
          <View
            key={item.label}
            style={[styles.menuRow, i < 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <View style={styles.menuLeft}>
              <Feather name={item.icon} size={18} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
            </View>
            <Text style={[styles.menuValue, { color: colors.primary }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: colors.destructive, borderRadius: colors.radius }]}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
      </TouchableOpacity>

      <PremiumModal
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
        onSuccess={() => setProModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular" },
  freeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  freeBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  upgradeCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  upgradeCardContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  upgradeCardTitle: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  upgradeCardSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular" },
  menuSection: { borderWidth: 1 },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  menuValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14, borderWidth: 1.5 },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
