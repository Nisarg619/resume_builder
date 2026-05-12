import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  Platform
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { GlassCard, StartupButton, GradientText } from "@/components/DesignSystem";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SettingsScreen() {
  const colors = useColors();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Logout Failed", "Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <GradientText text="Settings" style={styles.title} />
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Manage your account, preferences, and subscription.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Profile</Text>
        <GlassCard style={styles.card}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{profile?.name?.[0] || user?.email?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.foreground }]}>{profile?.name || "User"}</Text>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
              <View style={[styles.planBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.planText, { color: colors.primary }]}>
                  {profile?.plan?.toUpperCase() || "FREE"} PLAN
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                <Feather name={actualTheme === "dark" ? "moon" : "sun"} size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Theme</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                  {theme === "system" ? "System Default" : theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.themeToggleGroup}>
              <TouchableOpacity 
                onPress={() => setTheme("light")}
                style={[styles.themeOption, theme === "light" && { backgroundColor: colors.primary + "15" }]}
              >
                <Feather name="sun" size={16} color={theme === "light" ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setTheme("dark")}
                style={[styles.themeOption, theme === "dark" && { backgroundColor: colors.primary + "15" }]}
              >
                <Feather name="moon" size={16} color={theme === "dark" ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setTheme("system")}
                style={[styles.themeOption, theme === "system" && { backgroundColor: colors.primary + "15" }]}
              >
                <Feather name="monitor" size={16} color={theme === "system" ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/pricing")}>
            <View style={styles.settingLabelRow}>
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                <Feather name="credit-card" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Billing & Subscription</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Manage your pro plan and invoices.</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <View style={styles.settingLabelRow}>
              <View style={[styles.iconContainer, { backgroundColor: colors.destructive + "15" }]}>
                <Feather name="log-out" size={18} color={colors.destructive} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.destructive }]}>Sign Out</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Logout of your current session.</Text>
              </View>
            </View>
          </TouchableOpacity>
        </GlassCard>
      </View>

      <View style={styles.dangerSection}>
        <StartupButton 
          title="Delete Account" 
          variant="outline"
          onPress={() => Alert.alert("Confirm", "Are you sure you want to delete your account? This action is irreversible.")}
          style={{ borderColor: colors.destructive }}
        />
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          ResumeAI v1.0.0 • Connected via Supabase
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60, maxWidth: 800, alignSelf: "center", width: "100%" },
  header: { marginBottom: 40, gap: 12 },
  title: { fontSize: 40 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  card: { padding: 20, gap: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  profileInfo: { gap: 4 },
  name: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 14 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start", marginTop: 4 },
  planText: { fontSize: 10, fontWeight: "800" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingLabelRow: { flexDirection: "row", alignItems: "center", gap: 16, flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingDesc: { fontSize: 13 },
  themeToggleGroup: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 12, padding: 4 },
  themeOption: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  divider: { height: 1, width: "100%", marginVertical: 8 },
  dangerSection: { marginTop: 20, gap: 24, alignItems: "center" },
  footerText: { fontSize: 12 },
});
