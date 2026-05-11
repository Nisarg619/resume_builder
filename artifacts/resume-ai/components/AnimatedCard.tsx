import React, { useEffect } from "react";
import { StyleSheet, Pressable, type ViewStyle } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  interpolate
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Card } from "./Card";

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
  onPress?: () => void;
  index?: number; // For staggered entry
  delay?: number;
}

export function AnimatedCard({ 
  children, 
  style, 
  elevated = false, 
  noPadding = false, 
  onPress,
  index = 0,
  delay = 100
}: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(index * delay, withSpring(0, { damping: 15 }));
  }, [index, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 10, stiffness: 200 });
      Haptics.selectionAsync();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1);
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <Pressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
      >
        <Card elevated={elevated} noPadding={noPadding}>
          {children}
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
});
