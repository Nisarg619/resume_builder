import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  Platform
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import Animated, { FadeIn } from "react-native-reanimated";

/**
 * Premium Glass Card component
 */
export const GlassCard = ({ 
  children, 
  style, 
  intensity = 80 
}: { 
  children: React.ReactNode; 
  style?: ViewStyle; 
  intensity?: number 
}) => {
  const colors = useColors();
  return (
    <View style={[styles.cardContainer, style]}>
      <BlurView 
        tint={colors.background === "#020617" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
        intensity={intensity}
        style={[styles.glass, { borderColor: colors.glassBorder, borderRadius: colors.radius }]}
      >
        {children}
      </BlurView>
    </View>
  );
};

/**
 * Gradient Text component for high-end headings
 */
export const GradientText = ({ 
  text, 
  style 
}: { 
  text: string; 
  style?: TextStyle 
}) => {
  const colors = useColors();
  return (
    <View style={styles.gradientTextContainer}>
      <Text style={[styles.gradientTextBase, style, { color: colors.foreground }]}>
        {text}
      </Text>
    </View>
  );
};

/**
 * Modern Startup Button with hover and press effects
 */
export const StartupButton = ({ 
  title, 
  onPress, 
  variant = "primary",
  style 
}: { 
  title: string; 
  onPress: () => void; 
  variant?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
}) => {
  const colors = useColors();
  
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[
        styles.button, 
        isOutline && { borderWidth: 1, borderColor: colors.border },
        !isPrimary && !isOutline && { backgroundColor: colors.secondary },
        style
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[colors.primary, colors.tint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: colors.radius }]}
        >
          <Text style={styles.buttonTextPrimary}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text style={[styles.buttonText, { color: colors.foreground }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  glass: {
    padding: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  gradientTextContainer: {
    flexDirection: "row",
  },
  gradientTextBase: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  buttonTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  }
});
