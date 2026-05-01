import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false }: CardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
          shadowColor: elevated ? "#1A237E" : "#000",
          shadowOpacity: elevated ? 0.1 : 0.04,
          shadowRadius: elevated ? 12 : 4,
          elevation: elevated ? 6 : 1,
        },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
  },
  padding: {
    padding: 16,
  },
});
