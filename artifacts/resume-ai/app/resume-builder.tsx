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
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useResume, type WorkExperience, type Education, type ResumeTemplate } from "@/context/ResumeContext";
import { StyledButton } from "@/components/StyledButton";
import { Card } from "@/components/Card";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useGetResume, useCreateResume, useUpdateResume } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

const STEPS = ["Personal", "Experience", "Education", "Skills", "Preview"];
const TEMPLATES: { id: ResumeTemplate; label: string; color: string }[] = [
  { id: "modern", label: "Modern", color: "#1A237E" },
  { id: "classic", label: "Classic", color: "#212121" },
  { id: "minimal", label: "Minimal", color: "#37474F" },
  { id: "creative", label: "Creative", color: "#4A148C" },
];

export default function ResumeBuilderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { currentResume, setCurrentResume, resumeTitle, setResumeTitle, resetResume } = useResume();
  const [step, setStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [skillsText, setSkillsText] = useState("");

  const { data: existingResume, isLoading: loadingResume } = useGetResume(id || "", {
    query: { enabled: !!id, queryKey: ["resume", id] },
  });
  const createMutation = useCreateResume();
  const updateMutation = useUpdateResume();

  useEffect(() => {
    if (!id) {
      resetResume();
      setSkillsText("");
      setInitialized(true);
      return;
    }
    if (existingResume && !initialized) {
      const resume = existingResume as any;
      const resumeData = resume.data ?? resume;
      if (resumeData && typeof resumeData === "object" && "personalInfo" in resumeData) {
        setCurrentResume(resumeData);
        setSkillsText(Array.isArray(resumeData.skills) ? resumeData.skills.join(", ") : "");
      }
      setResumeTitle(resume.title ?? "My Resume");
      setInitialized(true);
    }
  }, [existingResume, id, initialized]);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const updatePersonal = (key: string, val: string) => {
    setCurrentResume({ ...currentResume, personalInfo: { ...currentResume.personalInfo, [key]: val } });
  };

  const generateSummary = async () => {
    if (!currentResume.personalInfo.fullName) {
      Alert.alert("Missing info", "Please enter your name first.");
      return;
    }
    setAiLoading(true);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${base}/api/ai/resume-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify({
          fullName: currentResume.personalInfo.fullName,
          jobTitle: currentResume.workExperience[0]?.jobTitle ?? "",
          skills: currentResume.skills,
        }),
      });
      if (res.ok) {
        const result = await res.json() as { text: string };
        setCurrentResume({ ...currentResume, summary: result.text });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Failed to generate summary.");
      }
    } catch {
      Alert.alert("Error", "Failed to generate summary.");
    } finally {
      setAiLoading(false);
    }
  };

  const addExperience = () => {
    const exp: WorkExperience = {
      jobTitle: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      responsibilities: "",
      bullets: [],
    };
    setCurrentResume({ ...currentResume, workExperience: [...currentResume.workExperience, exp] });
  };

  const updateExperience = (idx: number, key: keyof WorkExperience, val: unknown) => {
    const updated = [...currentResume.workExperience];
    updated[idx] = { ...updated[idx]!, [key]: val };
    setCurrentResume({ ...currentResume, workExperience: updated });
  };

  const generateBullets = async (idx: number) => {
    const exp = currentResume.workExperience[idx];
    if (!exp?.responsibilities) {
      Alert.alert("Missing info", "Please enter your responsibilities first.");
      return;
    }
    setAiLoading(true);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${base}/api/ai/job-bullets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify({
          jobTitle: exp.jobTitle,
          company: exp.company,
          responsibilities: exp.responsibilities,
        }),
      });
      if (res.ok) {
        const result = await res.json() as { bullets: string[] };
        updateExperience(idx, "bullets", result.bullets);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Failed to generate bullets.");
      }
    } catch {
      Alert.alert("Error", "Failed to generate bullets.");
    } finally {
      setAiLoading(false);
    }
  };

  const removeExperience = (idx: number) => {
    setCurrentResume({ ...currentResume, workExperience: currentResume.workExperience.filter((_, i) => i !== idx) });
  };

  const addEducation = () => {
    const edu: Education = { degree: "", institution: "", location: "", graduationYear: "", gpa: "" };
    setCurrentResume({ ...currentResume, education: [...currentResume.education, edu] });
  };

  const updateEducation = (idx: number, key: keyof Education, val: string) => {
    const updated = [...currentResume.education];
    updated[idx] = { ...updated[idx]!, [key]: val };
    setCurrentResume({ ...currentResume, education: updated });
  };

  const handleSave = async () => {
    if (!currentResume.personalInfo.fullName) {
      Alert.alert("Missing info", "Please enter your full name.");
      return;
    }
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data: { title: resumeTitle, data: currentResume as any } });
      } else {
        await createMutation.mutateAsync({ data: { title: resumeTitle, data: currentResume as any } });
      }
      qc.invalidateQueries();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Your resume has been saved.", [{ text: "OK", onPress: () => router.back() }]);
    } catch {
      Alert.alert("Error", "Failed to save resume. Please try again.");
    }
  };

  const inputStyle = [
    styles.input,
    {
      borderColor: colors.input,
      color: colors.foreground,
      backgroundColor: colors.background,
      borderRadius: colors.radius - 4,
    },
  ];
  const labelStyle = [styles.label, { color: colors.mutedForeground }];

  if (id && loadingResume && !initialized) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading resume...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TextInput
          value={resumeTitle}
          onChangeText={setResumeTitle}
          style={[styles.titleInput, { color: colors.foreground }]}
          placeholder="Resume title"
          placeholderTextColor={colors.mutedForeground}
        />
        <TouchableOpacity onPress={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <TouchableOpacity key={s} onPress={() => setStep(i)} style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: i <= step ? colors.primary : colors.muted }]}>
              {i < step ? (
                <Feather name="check" size={10} color="#fff" />
              ) : (
                <Text style={[styles.stepNum, { color: i === step ? "#fff" : colors.mutedForeground }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, { color: i === step ? colors.primary : colors.mutedForeground }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Information</Text>
            {[
              { key: "fullName", label: "Full Name*", placeholder: "John Smith" },
              { key: "email", label: "Email*", placeholder: "john@example.com" },
              { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
              { key: "location", label: "Location", placeholder: "Mumbai, India" },
              { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/johnsmith" },
              { key: "website", label: "Website/Portfolio", placeholder: "johnsmith.dev" },
            ].map(({ key, label, placeholder }) => (
              <View key={key} style={styles.field}>
                <Text style={labelStyle}>{label}</Text>
                <TextInput
                  style={inputStyle}
                  placeholder={placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={(currentResume.personalInfo as any)[key] || ""}
                  onChangeText={(v) => updatePersonal(key, v)}
                  autoCapitalize={key === "fullName" ? "words" : "none"}
                  keyboardType={key === "email" ? "email-address" : key === "phone" ? "phone-pad" : "default"}
                />
              </View>
            ))}
            <View style={styles.field}>
              <View style={styles.rowBetween}>
                <Text style={labelStyle}>Professional Summary</Text>
                <TouchableOpacity
                  onPress={generateSummary}
                  style={[styles.aiBtn, { backgroundColor: colors.secondary, borderRadius: 8 }]}
                >
                  <Feather name="zap" size={14} color={colors.primary} />
                  <Text style={[styles.aiBtnText, { color: colors.primary }]}>AI Generate</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[inputStyle, styles.textarea]}
                placeholder="A results-driven professional with..."
                placeholderTextColor={colors.mutedForeground}
                value={currentResume.summary}
                onChangeText={(v) => setCurrentResume({ ...currentResume, summary: v })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Work Experience</Text>
            {currentResume.workExperience.map((exp, idx) => (
              <Card key={idx} style={{ gap: 12, marginBottom: 16 }}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Position {idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeExperience(idx)}>
                    <Feather name="trash-2" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
                {[
                  { key: "jobTitle" as const, label: "Job Title*", placeholder: "Software Engineer" },
                  { key: "company" as const, label: "Company*", placeholder: "Acme Corp" },
                  { key: "location" as const, label: "Location", placeholder: "Bangalore, India" },
                  { key: "startDate" as const, label: "Start Date", placeholder: "Jan 2022" },
                ].map(({ key, label, placeholder }) => (
                  <View key={key} style={styles.field}>
                    <Text style={labelStyle}>{label}</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder={placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      value={exp[key] as string}
                      onChangeText={(v) => updateExperience(idx, key, v)}
                    />
                  </View>
                ))}
                <View style={styles.field}>
                  <View style={styles.rowBetween}>
                    <Text style={labelStyle}>Currently working here</Text>
                    <Switch
                      value={exp.isCurrent}
                      onValueChange={(v) => updateExperience(idx, "isCurrent", v)}
                      trackColor={{ true: colors.primary }}
                    />
                  </View>
                </View>
                {!exp.isCurrent && (
                  <View style={styles.field}>
                    <Text style={labelStyle}>End Date</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder="Dec 2023"
                      placeholderTextColor={colors.mutedForeground}
                      value={exp.endDate}
                      onChangeText={(v) => updateExperience(idx, "endDate", v)}
                    />
                  </View>
                )}
                <View style={styles.field}>
                  <Text style={labelStyle}>Responsibilities</Text>
                  <TextInput
                    style={[inputStyle, styles.textarea]}
                    placeholder="Describe what you did in this role..."
                    placeholderTextColor={colors.mutedForeground}
                    value={exp.responsibilities}
                    onChangeText={(v) => updateExperience(idx, "responsibilities", v)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.aiBtn, { backgroundColor: colors.secondary, borderRadius: 8, alignSelf: "flex-start" }]}
                  onPress={() => generateBullets(idx)}
                >
                  <Feather name="zap" size={14} color={colors.primary} />
                  <Text style={[styles.aiBtnText, { color: colors.primary }]}>Generate Bullet Points</Text>
                </TouchableOpacity>
                {exp.bullets.length > 0 && (
                  <View style={styles.bulletsList}>
                    {exp.bullets.map((b, bi) => (
                      <Text key={bi} style={[styles.bulletItem, { color: colors.foreground }]}>• {b}</Text>
                    ))}
                  </View>
                )}
              </Card>
            ))}
            <StyledButton
              title="Add Experience"
              onPress={addExperience}
              variant="outline"
              icon={<Feather name="plus" size={16} color={colors.primary} />}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Education</Text>
            {currentResume.education.map((edu, idx) => (
              <Card key={idx} style={{ gap: 12, marginBottom: 16 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Education {idx + 1}</Text>
                {[
                  { key: "degree" as const, label: "Degree*", placeholder: "B.Tech Computer Science" },
                  { key: "institution" as const, label: "Institution*", placeholder: "IIT Bombay" },
                  { key: "location" as const, label: "Location", placeholder: "Mumbai, India" },
                  { key: "graduationYear" as const, label: "Graduation Year", placeholder: "2022" },
                  { key: "gpa" as const, label: "GPA / Percentage", placeholder: "8.5 / 10" },
                ].map(({ key, label, placeholder }) => (
                  <View key={key} style={styles.field}>
                    <Text style={labelStyle}>{label}</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder={placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      value={edu[key]}
                      onChangeText={(v) => updateEducation(idx, key, v)}
                    />
                  </View>
                ))}
              </Card>
            ))}
            <StyledButton
              title="Add Education"
              onPress={addEducation}
              variant="outline"
              icon={<Feather name="plus" size={16} color={colors.primary} />}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skills & Template</Text>
            <View style={styles.field}>
              <Text style={labelStyle}>Skills (comma separated)</Text>
              <TextInput
                style={[inputStyle, styles.textarea]}
                placeholder="React, TypeScript, Node.js, AWS..."
                placeholderTextColor={colors.mutedForeground}
                value={skillsText}
                onChangeText={setSkillsText}
                onBlur={() =>
                  setCurrentResume({
                    ...currentResume,
                    skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.field}>
              <Text style={labelStyle}>Template</Text>
              <View style={styles.templatesRow}>
                {TEMPLATES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.templateCard,
                      {
                        backgroundColor: currentResume.template === t.id ? t.color : colors.card,
                        borderColor: currentResume.template === t.id ? t.color : colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                    onPress={() => setCurrentResume({ ...currentResume, template: t.id })}
                  >
                    <Text
                      style={[
                        styles.templateLabel,
                        { color: currentResume.template === t.id ? "#fff" : colors.foreground },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preview & Save</Text>
            <Card elevated style={{ gap: 12 }}>
              <Text style={[styles.previewName, { color: colors.foreground }]}>
                {currentResume.personalInfo.fullName || "Your Name"}
              </Text>
              <Text style={[styles.previewContact, { color: colors.mutedForeground }]}>
                {[
                  currentResume.personalInfo.email,
                  currentResume.personalInfo.phone,
                  currentResume.personalInfo.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {currentResume.summary ? (
                <Text style={[styles.previewSummary, { color: colors.foreground }]}>{currentResume.summary}</Text>
              ) : null}
              {currentResume.workExperience.length > 0 && (
                <View>
                  <Text style={[styles.previewSection, { color: colors.primary }]}>EXPERIENCE</Text>
                  {currentResume.workExperience.map((e, i) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Text style={[styles.previewJob, { color: colors.foreground }]}>
                        {e.jobTitle} at {e.company}
                      </Text>
                      <Text style={[styles.previewDate, { color: colors.mutedForeground }]}>
                        {e.startDate} – {e.isCurrent ? "Present" : e.endDate}
                      </Text>
                      {e.bullets.slice(0, 3).map((b, bi) => (
                        <Text key={bi} style={[styles.previewBullet, { color: colors.foreground }]}>• {b}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              {currentResume.education.length > 0 && (
                <View>
                  <Text style={[styles.previewSection, { color: colors.primary }]}>EDUCATION</Text>
                  {currentResume.education.map((e, i) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Text style={[styles.previewJob, { color: colors.foreground }]}>{e.degree}</Text>
                      <Text style={[styles.previewDate, { color: colors.mutedForeground }]}>
                        {e.institution} · {e.graduationYear}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {currentResume.skills.length > 0 && (
                <View>
                  <Text style={[styles.previewSection, { color: colors.primary }]}>SKILLS</Text>
                  <Text style={[styles.previewSkills, { color: colors.foreground }]}>
                    {currentResume.skills.join(", ")}
                  </Text>
                </View>
              )}
            </Card>
            <StyledButton
              title={id ? "Update Resume" : "Save Resume"}
              onPress={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              fullWidth
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        <View style={styles.navButtons}>
          {step > 0 && (
            <StyledButton title="Back" onPress={() => setStep(step - 1)} variant="outline" style={{ flex: 1 }} />
          )}
          {step < STEPS.length - 1 && (
            <StyledButton title="Next" onPress={() => setStep(step + 1)} style={{ flex: 1 }} />
          )}
        </View>
      </ScrollView>

      <LoadingOverlay visible={aiLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, fontFamily: "Inter_400Regular" },
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
  saveBtn: { fontSize: 16, fontFamily: "Inter_700Bold", paddingHorizontal: 4 },
  stepBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: { alignItems: "center", gap: 4, flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  stepLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1.5, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 100 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aiBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  aiBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bulletsList: { gap: 4 },
  bulletItem: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  navButtons: { flexDirection: "row", gap: 12, marginTop: 24 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  templatesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  templateCard: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 2 },
  templateLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  previewName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  previewContact: { fontSize: 12, fontFamily: "Inter_400Regular" },
  previewSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  previewSection: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 6 },
  previewJob: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  previewDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  previewBullet: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  previewSkills: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
