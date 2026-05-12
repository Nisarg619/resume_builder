import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    translateY.value = withTiming(-150, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setToast)(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = 4000 }: ToastOptions) => {
      console.log("[Toast] Showing toast", { title, message, type, top: insets.top });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setToast({ title, message, type, duration });
      translateY.value = withSpring(insets.top + 20, { damping: 14, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 200 });

      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [insets.top, translateY, opacity, hideToast]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    if (toast?.type === "success") return <Feather name="check-circle" size={24} color={colors.success} />;
    if (toast?.type === "error") return <Feather name="alert-circle" size={24} color={colors.destructive} />;
    return <Feather name="info" size={24} color={colors.primary} />;
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            animatedStyle,
          ]}
          pointerEvents="none"
        >
          <BlurView
            tint={colors.background === "#020617" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
            intensity={90}
            style={[
              styles.toastContent,
              {
                borderColor: colors.glassBorder,
                backgroundColor: colors.card,
              }
            ]}
          >
            <View style={styles.iconContainer}>{getIcon()}</View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.foreground }]}>{toast.title}</Text>
              {toast.message && (
                <Text style={[styles.message, { color: colors.mutedForeground }]}>{toast.message}</Text>
              )}
            </View>
          </BlurView>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  message: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
