import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useColors } from "@/hooks/useColors";
import { useResume } from "@/context/ResumeContext";
import { StyledButton } from "@/components/StyledButton";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";

type Step = "upload" | "boost" | "done";

export default function UploadResumeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentResume, setResumeTitle } = useResume();

  const [step, setStep] = useState<Step>("upload");
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [parsing, setParsing] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [estimatedScore, setEstimatedScore] = useState(0);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setPickedFile(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Could not open file picker. Please try again.");
    }
  };

  const uploadAndParse = async () => {
    if (!pickedFile) {
      Alert.alert("No file", "Please select a PDF resume first.");
      return;
    }
    setParsing(true);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const formData = new FormData();
      if (Platform.OS === "web") {
        const response = await fetch(pickedFile.uri);
        const blob = await response.blob();
        formData.append("resume", blob, pickedFile.name);
      } else {
        formData.append("resume", {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType ?? "application/pdf",
        } as unknown as Blob);
      }

      const res = await fetch(`${base}/api/ai/parse-resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error || "Failed to parse resume");
      }

      const result = await res.json() as { data: Record<string, unknown> };
      setParsedData(result.data);
      setStep("boost");
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert("Parse failed", e.message || "Could not read the PDF. Make sure it contains selectable text.");
    } finally {
      setParsing(false);
    }
  };

  const boostATS = async () => {
    if (!parsedData) return;
    setBoosting(true);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${base}/api/ai/ats-boost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeData: parsedData,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error || "ATS boost failed");
      }

      const result = await res.json() as {
        optimizedData: Record<string, unknown>;
        improvements: string[];
        estimatedScore: number;
      };

      setImprovements(result.improvements);
      setEstimatedScore(result.estimatedScore);
      setParsedData(result.optimizedData);
      setStep("done");
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert("Optimization failed", e.message || "Please try again.");
    } finally {
      setBoosting(false);
    }
  };

  const skipBoost = () => {
    if (!parsedData) return;
    loadIntoBuilder(parsedData);
  };

  const loadIntoBuilder = (data: Record<string, unknown>) => {
    setCurrentResume(data as unknown as Parameters<typeof setCurrentResume>[0]);
    const name = (data.personalInfo as { fullName?: string })?.fullName;
    setResumeTitle(name ? `${name}'s Resume` : "Uploaded Resume");
    router.replace("/resume-builder");
  };

  const handleUseFinal = () => {
    if (parsedData) loadIntoBuilder(parsedData);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Upload Resume</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {step === "upload" && (
          <>
            <View style={styles.heroSection}>
              <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="upload" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Upload Your Existing Resume</Text>
              <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
                We'll extract your information and use AI to boost it to 95%+ ATS score
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.dropzone, {
                borderColor: pickedFile ? colors.primary : colors.border,
                backgroundColor: pickedFile ? colors.secondary : colors.card,
                borderRadius: colors.radius,
              }]}
              onPress={pickFile}
              activeOpacity={0.8}
            >
              {pickedFile ? (
                <View style={styles.fileSelected}>
                  <View style={[styles.fileIcon, { backgroundColor: colors.primary }]}>
                    <Feather name="file-text" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>
                      {pickedFile.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: colors.mutedForeground }]}>
                      {pickedFile.size ? `${(pickedFile.size / 1024).toFixed(0)} KB` : "PDF file"}
                    </Text>
                  </View>
                  <Feather name="check-circle" size={20} color={colors.primary} />
                </View>
              ) : (
                <View style={styles.dropzoneContent}>
                  <Feather name="paperclip" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.dropzoneText, { color: colors.foreground }]}>Tap to select PDF</Text>
                  <Text style={[styles.dropzoneSub, { color: colors.mutedForeground }]}>PDF format, max 10 MB</Text>
                </View>
              )}
            </TouchableOpacity>

            {pickedFile && (
              <TouchableOpacity onPress={pickFile} style={{ alignItems: "center" }}>
                <Text style={[styles.changeFile, { color: colors.primary }]}>Change file</Text>
              </TouchableOpacity>
            )}

            <Card style={{ gap: 10 }}>
              <View style={styles.infoRow}>
                <Feather name="zap" size={16} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.foreground }]}>AI extracts all your information automatically</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="target" size={16} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.foreground }]}>Boosts resume to 95%+ ATS score</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="edit-3" size={16} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.foreground }]}>You can edit everything in the builder after</Text>
              </View>
            </Card>

            <StyledButton
              title={parsing ? "Parsing PDF..." : "Continue"}
              onPress={uploadAndParse}
              loading={parsing}
              disabled={!pickedFile || parsing}
              fullWidth
              icon={!parsing ? <Feather name="arrow-right" size={18} color="#fff" /> : undefined}
            />
          </>
        )}

        {step === "boost" && (
          <>
            <View style={[styles.successBanner, { backgroundColor: "#E8F5E9", borderRadius: colors.radius }]}>
              <Feather name="check-circle" size={24} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Resume Parsed!</Text>
                <Text style={styles.successSub}>
                  Your information has been extracted. Now let's supercharge it.
                </Text>
              </View>
            </View>

            <View style={styles.scorePreview}>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Current estimated ATS score</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreCurrent, { color: colors.foreground }]}>~60-70%</Text>
                <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
                <Text style={[styles.scoreTarget, { color: "#2E7D32" }]}>95%+</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Job Description{" "}
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional but recommended)</Text>
              </Text>
              <Text style={[styles.labelSub, { color: colors.mutedForeground }]}>
                Paste the job description to tailor your resume for that specific role
              </Text>
              <TextInput
                style={[styles.textarea, {
                  borderColor: colors.input,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderRadius: colors.radius - 4,
                }]}
                placeholder="Paste job description here (optional)..."
                placeholderTextColor={colors.mutedForeground}
                value={jobDescription}
                onChangeText={setJobDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <StyledButton
              title={boosting ? "Boosting to 95%+ ATS..." : "Boost ATS Score with AI"}
              onPress={boostATS}
              loading={boosting}
              disabled={boosting}
              fullWidth
              icon={!boosting ? <Feather name="zap" size={18} color="#fff" /> : undefined}
            />

            <TouchableOpacity onPress={skipBoost} disabled={boosting} style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                Skip optimization → use as-is
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === "done" && (
          <>
            <View style={[styles.scoreBanner, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
              <Text style={[styles.scoreBig, { color: colors.primary }]}>{estimatedScore}%</Text>
              <Text style={[styles.scoreTitle, { color: colors.foreground }]}>ATS Score</Text>
              <Text style={[styles.scoreDesc, { color: colors.mutedForeground }]}>
                Your resume has been optimized and is ready to beat ATS filters
              </Text>
            </View>

            <View style={styles.improvementsSection}>
              <Text style={[styles.improvementsTitle, { color: colors.foreground }]}>What we improved</Text>
              {improvements.map((item, i) => (
                <View key={i} style={styles.improvementRow}>
                  <View style={[styles.improvementDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.improvementText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
            </View>

            <StyledButton
              title="Open in Resume Builder"
              onPress={handleUseFinal}
              fullWidth
              icon={<Feather name="edit-3" size={18} color="#fff" />}
            />

            <Card style={{ gap: 8, marginTop: 4 }}>
              <View style={styles.infoRow}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Review and fine-tune any details in the resume builder before saving
                </Text>
              </View>
            </Card>
          </>
        )}

        {(parsing || boosting) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {parsing ? "Reading your PDF and extracting information..." : "AI is optimizing your resume for maximum ATS compatibility..."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 24, gap: 20 },
  heroSection: { alignItems: "center", gap: 12, paddingVertical: 8 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  dropzone: {
    borderWidth: 2, borderStyle: "dashed", padding: 28,
    alignItems: "center", justifyContent: "center", minHeight: 120,
  },
  dropzoneContent: { alignItems: "center", gap: 8 },
  dropzoneText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dropzoneSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  fileSelected: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%" },
  fileIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fileName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  fileSize: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  changeFile: { fontSize: 14, fontFamily: "Inter_500Medium" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  successBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16 },
  successTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#2E7D32" },
  successSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#388E3C", marginTop: 2 },
  scorePreview: { alignItems: "center", gap: 8 },
  scoreLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  scoreCurrent: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scoreTarget: { fontSize: 28, fontFamily: "Inter_700Bold" },
  field: { gap: 8 },
  label: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  labelSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  textarea: { borderWidth: 1.5, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 120 },
  skipText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  scoreBanner: { alignItems: "center", padding: 28, gap: 6 },
  scoreBig: { fontSize: 64, fontFamily: "Inter_700Bold", lineHeight: 72 },
  scoreTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  scoreDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  improvementsSection: { gap: 12 },
  improvementsTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  improvementRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  improvementDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  improvementText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  loadingOverlay: { alignItems: "center", gap: 16, paddingVertical: 8 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
