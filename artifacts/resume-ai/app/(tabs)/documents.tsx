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
import { useListResumes, useListCoverLetters, useDeleteResume, useDeleteCoverLetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "resumes" | "letters";

export default function DocumentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("resumes");

  const { data: resumes, isLoading: rLoading } = useListResumes();
  const { data: coverLetters, isLoading: lLoading } = useListCoverLetters();
  const deleteMutation = useDeleteResume();
  const deleteLetterMutation = useDeleteCoverLetter();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const confirmDelete = (id: string, type: "resume" | "letter") => {
    Alert.alert(
      "Delete",
      `Are you sure you want to delete this ${type === "resume" ? "resume" : "cover letter"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (type === "resume") {
              await deleteMutation.mutateAsync({ id });
            } else {
              await deleteLetterMutation.mutateAsync({ id });
            }
            qc.invalidateQueries();
          },
        },
      ]
    );
  };

  const isEmpty = tab === "resumes" ? !resumes?.length : !coverLetters?.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, paddingHorizontal: 20, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Documents</Text>
        <View style={[styles.tabRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          {(["resumes", "letters"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { backgroundColor: colors.card, borderRadius: colors.radius - 2 }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "resumes" ? "Resumes" : "Cover Letters"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.empty}>
            <Feather name="folder" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No {tab === "resumes" ? "resumes" : "cover letters"} yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Create your first one using AI
            </Text>
          </View>
        ) : (
          (tab === "resumes" ? resumes! : coverLetters!).map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}
              onPress={() => {
                if (tab === "resumes") router.push(`/resume-builder?id=${item.id}`);
                else router.push(`/cover-letter?id=${item.id}`);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: tab === "resumes" ? colors.secondary : "#E8F5E9" }]}>
                <Feather
                  name={tab === "resumes" ? "file-text" : "mail"}
                  size={20}
                  color={tab === "resumes" ? colors.primary : "#1B5E20"}
                />
              </View>
              <View style={styles.info}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
                  {item.companyName ? `${item.companyName} · ` : ""}{new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id, tab === "resumes" ? "resume" : "letter")}
                style={styles.deleteBtn}
              >
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 16, gap: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  list: { padding: 20, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12, borderWidth: 1 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  itemTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  deleteBtn: { padding: 6 },
  empty: { alignItems: "center", gap: 12, paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B7280" },
});
