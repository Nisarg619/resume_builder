import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Platform, Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { Card } from "@/components/Card";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { useGetCoverLetter, useCreateCoverLetter, useUpdateCoverLetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { getApiBaseUrl } from "@/lib/baseUrl";

// ── Config ──────────────────────────────────────────────────────────
const TONES = [
  { id: "professional", label: "Professional", icon: "briefcase", desc: "Formal & polished" },
  { id: "conversational", label: "Conversational", icon: "message-circle", desc: "Warm & personable" },
  { id: "enthusiastic", label: "Enthusiastic", icon: "zap", desc: "Energetic & passionate" },
  { id: "executive", label: "Executive", icon: "award", desc: "Strategic & authoritative" },
  { id: "creative", label: "Creative", icon: "feather", desc: "Unique & memorable" },
] as const;

const LEVELS = [
  { id: "fresher", label: "Fresher", desc: "Student / New Grad" },
  { id: "professional", label: "Professional", desc: "2-8 years experience" },
  { id: "senior", label: "Senior", desc: "8+ years / Leadership" },
] as const;

const PARA_LABELS = ["Opening Hook", "Experience & Skills", "Closing & CTA"];

// ── Main Screen ─────────────────────────────────────────────────────
export default function CoverLetterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [title, setTitle] = useState("Cover Letter");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("professional");
  const [level, setLevel] = useState("professional");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [editingPara, setEditingPara] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [regenIdx, setRegenIdx] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [step, setStep] = useState<"config" | "preview">("config");

  const { data: existing } = useGetCoverLetter(id || "", { query: { enabled: !!id, queryKey: ["cover-letter", id] } });
  const createMutation = useCreateCoverLetter();
  const updateMutation = useUpdateCoverLetter();

  useEffect(() => {
    if (!id) { setInitialized(true); return; }
    if (existing && !initialized) {
      setTitle(existing.title);
      setJobTitle(existing.jobTitle || "");
      setCompanyName(existing.companyName || "");
      if (existing.content) {
        const parts = existing.content.split(/\n{2,}/);
        setParagraphs(parts.length >= 3 ? parts.slice(0, 3) : [existing.content]);
        setStep("preview");
      }
      setInitialized(true);
    }
  }, [existing, id, initialized]);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const fullContent = paragraphs.join("\n\n");

  // ── API helpers ───────────────────────────────────────────────────
  const fetchAI = useCallback(async (body: Record<string, unknown>): Promise<string> => {
    const base = getApiBaseUrl();
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`${base}/api/ai/cover-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed");
    const r = await res.json() as { text: string };
    return r.text;
  }, []);

  const generateFull = useCallback(async () => {
    if (!jobTitle || !companyName || !jobDescription) {
      Alert.alert("Missing info", "Please fill in job title, company, and job description.");
      return;
    }
    setAiLoading(true);
    try {
      const text = await fetchAI({ jobTitle, companyName, jobDescription, tone, experienceLevel: level });
      const parts = text.split(/\n{2,}/).filter(Boolean);
      setParagraphs(parts.length >= 3 ? parts.slice(0, 3) : [text]);
      setStep("preview");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ title: "Cover Letter Generated!", type: "success" });
    } catch {
      showToast({ title: "Generation Failed", message: "Please try again.", type: "error" });
    } finally {
      setAiLoading(false);
    }
  }, [jobTitle, companyName, jobDescription, tone, level, fetchAI]);

  const regeneratePara = useCallback(async (idx: number) => {
    setRegenIdx(idx);
    try {
      const text = await fetchAI({
        jobTitle, companyName, jobDescription, tone, experienceLevel: level,
        paragraphToRegenerate: idx, existingParagraphs: paragraphs,
      });
      const updated = [...paragraphs];
      updated[idx] = text;
      setParagraphs(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showToast({ title: "Regeneration Failed", type: "error" });
    } finally {
      setRegenIdx(null);
    }
  }, [jobTitle, companyName, jobDescription, tone, level, paragraphs, fetchAI]);

  const handleSave = useCallback(async () => {
    if (!fullContent) { Alert.alert("Empty", "Generate a cover letter first."); return; }
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data: { title, content: fullContent } });
      } else {
        await createMutation.mutateAsync({ data: { title, jobTitle, companyName, content: fullContent } });
      }
      qc.invalidateQueries();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ title: "Saved!", message: "Cover letter saved successfully.", type: "success" });
      router.back();
    } catch {
      showToast({ title: "Save Failed", type: "error" });
    }
  }, [id, title, jobTitle, companyName, fullContent]);

  const handleShare = useCallback(async () => {
    if (!fullContent) return;
    try {
      await Share.share({ message: fullContent, title });
    } catch { /* user cancelled */ }
  }, [fullContent, title]);

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input, borderRadius: colors.radius - 4 }];
  const labelStyle = [styles.label, { color: colors.foreground }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TextInput value={title} onChangeText={setTitle}
          style={[styles.titleInput, { color: colors.foreground }]}
          placeholder="Cover Letter title" placeholderTextColor={colors.mutedForeground} />
        <TouchableOpacity onPress={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step tabs */}
      {paragraphs.length > 0 && (
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {(["config", "preview"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setStep(t)}
              style={[styles.tab, step === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <Feather name={t === "config" ? "sliders" : "eye"} size={16}
                color={step === t ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: step === t ? colors.primary : colors.mutedForeground }]}>
                {t === "config" ? "Configure" : "Preview & Edit"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {/* ── CONFIG STEP ──────────────────────────────── */}
        {step === "config" && (
          <>
            {/* Job Details */}
            <Card style={{ gap: 14 }}>
              <View style={styles.fieldHeader}>
                <Feather name="briefcase" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Job Details</Text>
              </View>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={labelStyle}>Job Title *</Text>
                  <TextInput style={inputStyle} placeholder="Software Engineer"
                    placeholderTextColor={colors.mutedForeground} value={jobTitle} onChangeText={setJobTitle} />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={labelStyle}>Company *</Text>
                  <TextInput style={inputStyle} placeholder="Google"
                    placeholderTextColor={colors.mutedForeground} value={companyName} onChangeText={setCompanyName} />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={labelStyle}>Job Description *</Text>
                <TextInput style={[inputStyle, styles.textarea]} placeholder="Paste the job description..."
                  placeholderTextColor={colors.mutedForeground} value={jobDescription}
                  onChangeText={setJobDescription} multiline textAlignVertical="top" />
              </View>
            </Card>

            {/* Experience Level */}
            <Card style={{ gap: 12 }}>
              <View style={styles.fieldHeader}>
                <Feather name="user" size={18} color={colors.tint} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Experience Level</Text>
              </View>
              <View style={styles.optionRow}>
                {LEVELS.map((l) => (
                  <TouchableOpacity key={l.id} onPress={() => setLevel(l.id)}
                    style={[styles.levelCard, {
                      backgroundColor: level === l.id ? colors.primary : colors.muted,
                      borderRadius: colors.radius - 4,
                      borderColor: level === l.id ? colors.primary : colors.border, borderWidth: 1,
                    }]} activeOpacity={0.8}>
                    <Text style={[styles.levelLabel, { color: level === l.id ? "#fff" : colors.foreground }]}>{l.label}</Text>
                    <Text style={[styles.levelDesc, { color: level === l.id ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>{l.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Tone */}
            <Card style={{ gap: 12 }}>
              <View style={styles.fieldHeader}>
                <Feather name="mic" size={18} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Writing Tone</Text>
              </View>
              <View style={styles.toneGrid}>
                {TONES.map((t) => (
                  <TouchableOpacity key={t.id} onPress={() => setTone(t.id)}
                    style={[styles.toneCard, {
                      backgroundColor: tone === t.id ? colors.primary + "15" : colors.muted,
                      borderRadius: colors.radius - 4,
                      borderColor: tone === t.id ? colors.primary : "transparent", borderWidth: 1.5,
                    }]} activeOpacity={0.8}>
                    <Feather name={t.icon as any} size={18} color={tone === t.id ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.toneName, { color: tone === t.id ? colors.primary : colors.foreground }]}>{t.label}</Text>
                    <Text style={[styles.toneDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Generate Button */}
            <StyledButton title={paragraphs.length > 0 ? "Regenerate Cover Letter" : "Generate Cover Letter"}
              onPress={generateFull} icon={<Feather name="zap" size={16} color="#fff" />}
              fullWidth loading={aiLoading} />
          </>
        )}

        {/* ── PREVIEW STEP ─────────────────────────────── */}
        {step === "preview" && (
          <>
            {paragraphs.length === 0 ? (
              <Card style={{ alignItems: "center", gap: 16, paddingVertical: 40 }}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                  <Feather name="mail" size={32} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Cover Letter Yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Switch to Configure tab and generate your cover letter
                </Text>
                <StyledButton title="Go to Configure" onPress={() => setStep("config")} variant="outline" />
              </Card>
            ) : (
              <>
                {/* Letter Preview */}
                <Animated.View entering={FadeInDown.duration(400)}>
                  <Card elevated style={{ gap: 0, padding: 0, overflow: "hidden" }}>
                    {/* Letter header bar */}
                    <View style={[styles.letterHeader, { backgroundColor: colors.primary + "10", borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.letterTo, { color: colors.foreground }]}>
                          {companyName ? `To: ${companyName}` : "Cover Letter"}
                        </Text>
                        <Text style={[styles.letterRole, { color: colors.mutedForeground }]}>
                          {jobTitle ? `Re: ${jobTitle} Position` : ""}
                        </Text>
                      </View>
                      <View style={[styles.toneBadge, { backgroundColor: colors.primary + "20", borderRadius: 8 }]}>
                        <Text style={[styles.toneBadgeText, { color: colors.primary }]}>
                          {TONES.find(t => t.id === tone)?.label || "Professional"}
                        </Text>
                      </View>
                    </View>

                    {/* Paragraphs */}
                    {paragraphs.map((para, idx) => (
                      <View key={idx} style={[styles.paraBlock, idx < paragraphs.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                        <View style={styles.paraHeader}>
                          <View style={[styles.paraNum, { backgroundColor: colors.primary + "15", borderRadius: 6 }]}>
                            <Text style={[styles.paraNumText, { color: colors.primary }]}>{idx + 1}</Text>
                          </View>
                          <Text style={[styles.paraLabel, { color: colors.mutedForeground }]}>{PARA_LABELS[idx] || `Paragraph ${idx + 1}`}</Text>
                          <TouchableOpacity onPress={() => setEditingPara(editingPara === idx ? null : idx)}
                            style={[styles.miniBtn, { backgroundColor: colors.muted, borderRadius: 6 }]}>
                            <Feather name={editingPara === idx ? "check" : "edit-2"} size={14} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => regeneratePara(idx)} disabled={regenIdx !== null}
                            style={[styles.miniBtn, { backgroundColor: colors.accent + "15", borderRadius: 6 }]}>
                            {regenIdx === idx ? (
                              <Skeleton width={14} height={14} borderRadius={7} />
                            ) : (
                              <Feather name="refresh-cw" size={14} color={colors.accent} />
                            )}
                          </TouchableOpacity>
                        </View>
                        {editingPara === idx ? (
                          <TextInput style={[inputStyle, { minHeight: 100 }]} value={para} multiline textAlignVertical="top"
                            onChangeText={(v) => { const u = [...paragraphs]; u[idx] = v; setParagraphs(u); }} />
                        ) : (
                          <Text style={[styles.paraText, { color: colors.foreground }]}>{para}</Text>
                        )}
                      </View>
                    ))}
                  </Card>
                </Animated.View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <StyledButton title="Save" onPress={handleSave} style={{ flex: 1 }}
                    loading={createMutation.isPending || updateMutation.isPending}
                    icon={<Feather name="save" size={16} color="#fff" />} />
                  <TouchableOpacity onPress={handleShare}
                    style={[styles.shareBtn, { borderColor: colors.border, borderRadius: colors.radius }]}>
                    <Feather name="share-2" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Regenerate full */}
                <StyledButton title="Regenerate Entire Letter" onPress={generateFull} variant="outline"
                  icon={<Feather name="refresh-cw" size={16} color={colors.primary} />} fullWidth loading={aiLoading} />
              </>
            )}
          </>
        )}
      </ScrollView>

      <LoadingOverlay visible={aiLoading} message="Writing your cover letter..." />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  titleInput: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_700Bold" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 20 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 16 },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", flex: 1 },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 120 },
  // Level
  optionRow: { flexDirection: "row", gap: 8 },
  levelCard: { flex: 1, padding: 12, alignItems: "center", gap: 4 },
  levelLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  levelDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  // Tone
  toneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toneCard: { width: "47%", padding: 12, gap: 4 },
  toneName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  toneDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Preview
  letterHeader: { padding: 16, borderBottomWidth: 1, flexDirection: "row", alignItems: "center" },
  letterTo: { fontSize: 16, fontFamily: "Inter_700Bold" },
  letterRole: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  toneBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  toneBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  paraBlock: { padding: 16, gap: 10 },
  paraHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  paraNum: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  paraNumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  paraLabel: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  miniBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  paraText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  actionRow: { flexDirection: "row", gap: 12 },
  shareBtn: { width: 52, height: 52, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  // Empty
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});