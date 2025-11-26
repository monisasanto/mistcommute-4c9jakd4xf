/**
 * Deterministic Design System for MistCommute
 * Generated from seed: SHA256("MistCommute" + "Sepolia" + "202511" + "MistCommute.sol")
 */

export const designTokens = {
  // Color palette - Transportation theme (blue/cyan spectrum)
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#2563eb", // Main primary
      600: "#1d4ed8",
      700: "#1e40af",
      800: "#1e3a8a",
      900: "#1e293b",
    },
    secondary: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4", // Main secondary (cyan)
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
    },
    accent: {
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1", // Main accent (indigo)
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
    },
    semantic: {
      success: "#10b981",
      successLight: "#d1fae5",
      warning: "#f59e0b",
      warningLight: "#fef3c7",
      error: "#ef4444",
      errorLight: "#fee2e2",
      info: "#3b82f6",
      infoLight: "#dbeafe",
    },
    neutral: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
    
    // Simplified aliases for easier component use
    background: "#ffffff",
    surface: "#f9fafb",
    border: "#e5e7eb",
    text: "#111827",
    textSecondary: "#4b5563",
    textMuted: "#9ca3af",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },

  // Typography
  typography: {
    fontFamily: {
      heading: "'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif",
      body: "'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif",
      mono: "'Fira Code', 'Courier New', monospace",
    },
    fontSize: {
      xs: "0.75rem",      // 12px
      sm: "0.875rem",     // 14px
      base: "1rem",       // 16px
      lg: "1.125rem",     // 18px
      xl: "1.25rem",      // 20px
      "2xl": "1.5rem",    // 24px
      "3xl": "1.875rem",  // 30px
      "4xl": "2.25rem",   // 36px
      "5xl": "3rem",      // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing (4px base unit)
  spacing: {
    xs: "0.25rem",   // 4px
    sm: "0.5rem",    // 8px
    md: "1rem",      // 16px
    lg: "1.5rem",    // 24px
    xl: "2rem",      // 32px
    "2xl": "3rem",   // 48px
    "3xl": "4rem",   // 64px
    "4xl": "6rem",   // 96px
  },

  // Border radius (medium round - 0.5rem selected from seed)
  borderRadius: {
    none: "0",
    sm: "0.25rem",
    DEFAULT: "0.5rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },

  // Shadows
  boxShadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  },

  // Transitions
  transition: {
    duration: {
      fast: "150ms",
      DEFAULT: "300ms",
      slow: "500ms",
    },
    timing: {
      DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)", // ease-in-out
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  // Breakpoints
  breakpoints: {
    mobile: "0px",
    tablet: "640px",
    desktop: "1024px",
  },

  // Component-specific tokens
  components: {
    button: {
      paddingX: {
        compact: "0.75rem",
        comfortable: "1.25rem",
      },
      paddingY: {
        compact: "0.375rem",
        comfortable: "0.625rem",
      },
      hoverScale: 1.02,
    },
    card: {
      padding: {
        compact: "1rem",
        comfortable: "1.5rem",
      },
      hoverTranslateY: "-2px",
    },
    input: {
      height: {
        compact: "2.25rem",
        comfortable: "2.75rem",
      },
      paddingX: {
        compact: "0.75rem",
        comfortable: "1rem",
      },
    },
    navbar: {
      height: "4rem",
      backdropBlur: "12px",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backgroundColorDark: "rgba(17, 24, 39, 0.8)",
    },
  },

  // Density modes
  density: {
    compact: {
      spacing: 0.75,
      fontSize: 0.875,
      padding: 0.75,
    },
    comfortable: {
      spacing: 1,
      fontSize: 1,
      padding: 1,
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
export type ColorScale = keyof typeof designTokens.colors.primary;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type Spacing = keyof typeof designTokens.spacing;
export type Density = "compact" | "comfortable";

/**
 * Utility function to get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}

/**
 * Utility function to apply density scale
 */
export function scaleDensity(value: number, density: Density): number {
  return value * designTokens.density[density].spacing;
}

