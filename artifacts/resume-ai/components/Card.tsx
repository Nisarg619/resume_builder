import React from "react";
import { View, StyleSheet, type ViewStyle, useColorScheme } from "react-native";
import { BlurView } from "expo-blur";
import { useColors } from "@/hooks/useColors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false }: CardProps) {
  const colors = useColors();
  const scheme = useColorScheme() ?? "light";
  
  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: colors.radius,
          shadowColor: elevated ? colors.primary : "#000",
          shadowOpacity: elevated ? 0.15 : 0.05,
          shadowRadius: elevated ? 16 : 8,
          elevation: elevated ? 8 : 2,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <BlurView
        tint={scheme === "dark" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
        intensity={80}
        style={[
          styles.blurContent,
          {
            backgroundColor: colors.card,
            borderColor: colors.glassBorder,
            borderWidth: 1,
          },
          !noPadding && styles.padding,
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
  },
  blurContent: {
    flex: 1,
  },
  padding: {
    padding: 20,
  },
});
