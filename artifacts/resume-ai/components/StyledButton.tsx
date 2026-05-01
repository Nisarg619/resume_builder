import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
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
}: StyledButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return { backgroundColor: colors.primary };
      case "secondary":
        return { backgroundColor: colors.secondary };
      case "outline":
        return { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary };
      case "ghost":
        return { backgroundColor: "transparent" };
      case "danger":
        return { backgroundColor: colors.destructive };
      case "pro":
        return { backgroundColor: colors.accent };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "primary":
      case "danger":
      case "pro":
        return { color: "#FFFFFF" };
      case "secondary":
        return { color: colors.primary };
      case "outline":
        return { color: colors.primary };
      case "ghost":
        return { color: colors.primary };
      default:
        return { color: "#FFFFFF" };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        { borderRadius: colors.radius },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  fullWidth: { width: "100%" },
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
