import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import { Stack, router, usePathname } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout() {
  const colors = useColors();
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const isWeb = Platform.OS === "web";

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sidebar (Web Only) */}
      {isWeb && (
        <View style={[styles.sidebar, { borderRightColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.sidebarHeader}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>R</Text>
            </View>
            <Text style={[styles.sidebarTitle, { color: colors.foreground }]}>ResumeAI</Text>
          </View>

          <View style={styles.sidebarContent}>
            <View style={styles.navGroup}>
              <NavItem 
                icon="grid" 
                label="Dashboard" 
                active={pathname.includes("dashboard-home")} 
                onPress={() => router.push("/(dashboard)/dashboard-home")} 
              />
              <NavItem 
                icon="file-text" 
                label="My Resumes" 
                active={pathname.includes("resume-builder")} 
                onPress={() => router.push("/(dashboard)/resume-builder")} 
              />
              <NavItem 
                icon="search" 
                label="ATS Analyzer" 
                active={pathname.includes("ats-checker")} 
                onPress={() => router.push("/(dashboard)/ats-checker")} 
              />
              <NavItem 
                icon="mail" 
                label="Cover Letters" 
                active={pathname.includes("cover-letter")} 
                onPress={() => router.push("/(dashboard)/cover-letter")} 
              />
            </View>

            <View style={styles.navGroup}>
              <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>Account</Text>
              <NavItem 
                icon="settings" 
                label="Settings" 
                active={pathname.includes("settings")} 
                onPress={() => router.push("/(dashboard)/settings")} 
              />
              <NavItem 
                icon="credit-card" 
                label="Pricing" 
                active={pathname.includes("pricing")} 
                onPress={() => router.push("/(dashboard)/pricing")} 
              />
            </View>
          </View>

          <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.userProfile} onPress={() => router.push("/settings")}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{profile?.name?.[0] || user?.email?.[0].toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                  {profile?.name || "User"}
                </Text>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.main}>
        {/* Header for Dashboard Content */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.headerLeft}>
            {!isWeb && (
              <TouchableOpacity onPress={() => router.push("/(dashboard)/dashboard-home")} style={styles.iconBtn}>
                <Feather name="grid" size={24} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerRight}>
            {!isWeb && (
              <TouchableOpacity onPress={() => router.push("/(dashboard)/settings")} style={styles.iconBtn}>
                <Feather name="settings" size={20} color={colors.foreground} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: colors.destructive + "10" }]}>
              <Feather name="log-out" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}>
          <Stack.Screen name="dashboard-home" options={{ title: "Dashboard" }} />
          <Stack.Screen name="resume-builder" options={{ title: "Builder" }} />
          <Stack.Screen name="ats-checker" options={{ title: "ATS Check" }} />
          <Stack.Screen name="cover-letter" options={{ title: "Cover Letter" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="pricing" options={{ title: "Pricing" }} />
        </Stack>
      </View>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }: any) {
  const colors = useColors();
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.navItem, 
        active && { backgroundColor: colors.primary + "15" }
      ]}
    >
      <Feather 
        name={icon} 
        size={20} 
        color={active ? colors.primary : colors.mutedForeground} 
      />
      <Text style={[
        styles.navLabel, 
        { color: active ? colors.foreground : colors.mutedForeground },
        active && { fontWeight: "600" }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 260,
    height: "100%",
    borderRightWidth: 1,
    padding: 20,
    gap: 32,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarFooter: {
    paddingTop: 20,
    borderTopWidth: 1,
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 12,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  navGroup: {
    gap: 4,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  navLabel: {
    fontSize: 14,
  },
  main: {
    flex: 1,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
