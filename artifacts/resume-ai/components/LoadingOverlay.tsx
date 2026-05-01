import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { useColors } from "@/hooks/useColors";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = "Generating with Claude AI..." }: LoadingOverlayProps) {
  const colors = useColors();
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.foreground }]}>{message}</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>This may take a few seconds</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 320,
  },
  text: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
