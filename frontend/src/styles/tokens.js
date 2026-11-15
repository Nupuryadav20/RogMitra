/**
 * RogMitra Theme 3 Design Tokens ("Patient Friendly")
 * Extracted directly from: docs/reference/RogMitra Healthcare App Dashboard Collage.png
 * Palette: Forest Green, Light Mint, Clean White, Rounded Radii, Soft Elevation Shadows
 */

export const themeTokens = {
  colors: {
    // Primary Greens
    primary: {
      DEFAULT: "#0D7A46", // Dark Forest Green (Active buttons, primary branding)
      dark: "#085A33",    // Pressed/Hover dark green
      light: "#189458",   // Lighter vibrant green
      muted: "#2A8557",   // Secondary green
    },
    // Mint / Canvas Backgrounds
    mint: {
      50: "#F4FBF7",      // App Canvas Background
      100: "#EDF8F1",     // Hero Card & Pill Background
      200: "#D6F0E0",     // Hover state on mint
      300: "#B8E4C9",     // Soft border mint
      400: "#86CEAA",     // Accent mint
      500: "#4DB385",     // Medium mint
    },
    // Cards & Surface
    surface: {
      card: "#FFFFFF",
      border: "#E2EFE7",
      hover: "#F9FCFA",
    },
    // Quick Action Card Accents
    quickActions: {
      voice: {
        bg: "#E8F8EE",
        icon: "#0D7A46",
      },
      documents: {
        bg: "#EBF5FF",
        icon: "#2563EB",
      },
      ayurveda: {
        bg: "#FEF8E7",
        icon: "#D97706",
      },
      summary: {
        bg: "#F3EFFC",
        icon: "#7C3AED",
      },
    },
    // Red Flag Alert Triage
    alert: {
      bg: "#FEF2F2",
      border: "#F87171",
      text: "#DC2626",
      badge: "#EF4444",
    },
    // Typography Colors
    text: {
      primary: "#111827",  // Slate 900
      secondary: "#374151",// Slate 700
      muted: "#6B7280",    // Slate 500
      brandMuted: "#486B56",// Greenish muted text
      inverse: "#FFFFFF",
    }
  },
  borderRadius: {
    xs: "4px",
    sm: "8px",
    md: "12px",     // Buttons, inputs
    lg: "16px",     // Standard cards
    xl: "24px",     // Hero cards & dashboard containers
    full: "9999px", // Pills, badges, stepper circles
  },
  boxShadow: {
    card: "0 4px 20px -2px rgba(13, 122, 70, 0.06)",
    cardHover: "0 8px 30px -4px rgba(13, 122, 70, 0.12)",
    button: "0 2px 8px 0 rgba(13, 122, 70, 0.20)",
  },
  fontFamily: {
    sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
  }
};

export default themeTokens;
