import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useGetCoverLetter, useCreateCoverLetter, useUpdateCoverLetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

export default function CoverLetterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [title, setTitle] = useState("Cover Letter");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [content, setContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const { data: existing } = useGetCoverLetter(id || "", { query: { enabled: !!id } });
  const createMutation = useCreateCoverLetter();
  const updateMutation = useUpdateCoverLetter();

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setJobTitle(existing.jobTitle || "");
      setCompanyName(existing.companyName || "");
      setContent(existing.content);
    }
  }, [existing]);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const generateCoverLetter = async () => {
    if (!jobTitle || !companyName || !jobDescription) {
      Alert.alert("Missing info", "Please fill in job title, company name, and job description.");
      return;
    }
    setAiLoading(true);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${base}/api/ai/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ jobTitle, companyName, jobDescription }),
      });
      const result = await res.json() as { text: string };
      setContent(result.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to generate cover letter.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) {
      Alert.alert("Missing content", "Please generate or write your cover letter first.");
      return;
    }
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data: { title, content } });
      } else {
        await createMutation.mutateAsync({ data: { title, jobTitle, companyName, content } });
      }
      qc.invalidateQueries();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Your cover letter has been saved.", [{ text: "OK", onPress: () => router.back() }]);
    } catch {
      Alert.alert("Error", "Failed to save cover letter.");
    }
  };

  const inputStyle = [styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius - 4 }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={[styles.titleInput, { color: colors.foreground }]}
          placeholder="Cover Letter title"
          placeholderTextColor={colors.mutedForeground}
        />
        <TouchableOpacity onPress={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Job Title*</Text>
            <TextInput
              style={inputStyle}
              placeholder="Software Engineer"
              placeholderTextColor={colors.mutedForeground}
              value={jobTitle}
              onChangeText={setJobTitle}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Company*</Text>
            <TextInput
              style={inputStyle}
              placeholder="Google"
              placeholderTextColor={colors.mutedForeground}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Job Description*</Text>
          <TextInput
            style={[inputStyle, styles.textarea]}
            placeholder="Paste the job description here..."
            placeholderTextColor={colors.mutedForeground}
            value={jobDescription}
            onChangeText={setJobDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <StyledButton
          title="Generate with Claude AI"
          onPress={generateCoverLetter}
          icon={<Feather name="zap" size={16} color="#fff" />}
          fullWidth
        />

        {content ? (
          <View style={styles.field}>
            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Cover Letter (editable)</Text>
              <TouchableOpacity onPress={generateCoverLetter}>
                <Text style={[styles.regenerate, { color: colors.primary }]}>Regenerate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[inputStyle, styles.letterArea]}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            <Feather name="mail" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Fill in the details above and tap "Generate" to create a tailored cover letter
            </Text>
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={aiLoading} message="Writing your cover letter..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  titleInput: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1.5, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 120 },
  letterArea: { minHeight: 300 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  regenerate: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyState: { padding: 32, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
