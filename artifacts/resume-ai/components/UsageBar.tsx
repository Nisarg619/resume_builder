import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { FREE_RESUME_LIMIT, FREE_COVER_LETTER_LIMIT } from "@/context/AuthContext";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
}

export function UsageBar({ label, used, limit }: UsageBarProps) {
  const colors = useColors();
  const pct = Math.min(used / limit, 1);
  const color = pct >= 1 ? colors.destructive : pct >= 0.67 ? colors.accent : colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.count, { color: colors.foreground }]}>{used}/{limit}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted, borderRadius: 4 }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%` as any, backgroundColor: color, borderRadius: 4 },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 13, fontFamily: "Inter_400Regular" },
  count: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  track: { height: 6, overflow: "hidden" },
  fill: { height: 6 },
});
