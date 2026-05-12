import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StyledButton } from "@/components/StyledButton";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/baseUrl";
import { supabase } from "@/lib/supabase";
import Animated, { FadeIn, FadeInUp, Layout } from "react-native-reanimated";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function MockInterviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<ScrollView>(null);

  const startInterview = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      Alert.alert("Missing Info", "Please provide a job title and description to begin.");
      return;
    }
    
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const { data: session } = await supabase.auth.getSession();
      
      const res = await fetch(`${base}/api/ai/interview/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          resumeData: {}, // In a real app, fetch the active resume
          chatHistory: [],
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsStarted(true);
        setMessages([{
          id: Math.random().toString(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        }]);
      } else {
        Alert.alert("Error", data.error || "Failed to start interview.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    
    try {
      const base = getApiBaseUrl();
      const { data: session } = await supabase.auth.getSession();
      
      const res = await fetch(`${base}/api/ai/interview/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          resumeData: {},
          chatHistory: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to get reply.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  if (!isStarted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
        <ScrollView contentContainerStyle={styles.setupScroll}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <Text style={[styles.title, { color: colors.foreground }]}>AI Mock Interview</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Practice with our virtual recruiter. Get real-time feedback and improve your answers.
            </Text>
          </Animated.View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Target Job Title</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="e.g. Senior Frontend Engineer"
                placeholderTextColor={colors.mutedForeground}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Job Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="Paste the requirements here..."
                placeholderTextColor={colors.mutedForeground}
                value={jobDescription}
                onChangeText={setJobDescription}
                multiline
                numberOfLines={6}
              />
            </View>

            <StyledButton
              title="Start Interview Session"
              onPress={startInterview}
              loading={loading}
              fullWidth
              style={{ marginTop: 10 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleArea}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{jobTitle}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Recruiter Online</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m, i) => (
          <Animated.View
            key={m.id}
            entering={FadeIn.delay(i * 100)}
            layout={Layout.springify()}
            style={[
              styles.messageBubble,
              m.role === "user" ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]
            ]}
          >
            <Text style={[styles.messageText, { color: m.role === "user" ? "#fff" : colors.foreground }]}>
              {m.content}
            </Text>
          </Animated.View>
        ))}
        {loading && (
          <Animated.View entering={FadeIn} style={[styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border, width: 60 }]}>
            <Text style={{ color: colors.mutedForeground }}>...</Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 10, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.chatInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          placeholder="Type your response..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Feather name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  setupScroll: { padding: 24, gap: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 12 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, padding: 14, borderRadius: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { height: 120, textAlignVertical: "top" },
  header: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, flexDirection: "row", alignItems: "center" },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chatArea: { flex: 1 },
  chatContent: { padding: 20, gap: 16 },
  messageBubble: { padding: 14, borderRadius: 18, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  inputArea: { padding: 15, flexDirection: "row", alignItems: "flex-end", gap: 12, borderTopWidth: 1 },
  chatInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
