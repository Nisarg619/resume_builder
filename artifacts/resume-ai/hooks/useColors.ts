import { useContext } from "react";
import colors from "@/constants/colors";
import { ThemeContext } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current theme (light or dark).
 * Falls back to light mode if ThemeProvider is not available.
 */
export function useColors() {
  const context = useContext(ThemeContext);
  
  const actualTheme = context?.actualTheme || "light";
  const palette = colors[actualTheme];
  
  return { 
    ...palette, 
    radius: colors.radius,
    isDark: actualTheme === "dark"
  };
}
