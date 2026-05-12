import React from "react";
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

interface StyledButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "pro";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

export function StyledButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = false,
  accessibilityLabel,
}: StyledButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
      case "pro":
        return { backgroundColor: "transparent", borderWidth: 0 };
      case "secondary":
        return { backgroundColor: colors.secondary };
      case "outline":
        return { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary };
      case "ghost":
        return { backgroundColor: "transparent" };
      case "danger":
        return { backgroundColor: colors.destructive };
      default:
        return { backgroundColor: "transparent" };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "primary":
      case "danger":
      case "pro":
        return { color: "#FFFFFF" };
      case "secondary":
      case "outline":
      case "ghost":
        return { color: colors.primary };
      default:
        return { color: "#FFFFFF" };
    }
  };

  const isGradient = variant === "primary" || variant === "pro";
  const gradientColors = (variant === "pro" 
    ? [colors.accent, "#EA580C"] 
    : [colors.primary, colors.tint]) as [string, string];

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" || variant === "secondary" ? colors.primary : "#fff"}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </>
  );

  return (
    <Animated.View style={[styles.container, fullWidth && styles.fullWidth, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled: disabled || loading }}
        style={({ pressed }) => [
          styles.button,
          getButtonStyle(),
          { borderRadius: colors.radius },
          (disabled || loading) && styles.disabled,
          style,
          isGradient && { paddingHorizontal: 0, paddingVertical: 0 }
        ]}
      >
        {isGradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { borderRadius: colors.radius }]}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
  },
  fullWidth: {
    width: "100%",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  gradient: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  disabled: { opacity: 0.55 },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  iconLeft: { marginRight: 2 },
  iconRight: { marginLeft: 2 },
});

