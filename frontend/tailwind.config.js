/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0D7A46",
          dark: "#085A33",
          light: "#189458",
          muted: "#2A8557",
        },
        mint: {
          50: "#F4FBF7",
          100: "#EDF8F1",
          200: "#D6F0E0",
          300: "#B8E4C9",
          400: "#86CEAA",
          500: "#4DB385",
        },
        surface: {
          card: "#FFFFFF",
          border: "#E2EFE7",
          hover: "#F9FCFA",
        },
        qaVoice: {
          bg: "#E8F8EE",
          icon: "#0D7A46",
        },
        qaDocs: {
          bg: "#EBF5FF",
          icon: "#2563EB",
        },
        qaAyur: {
          bg: "#FEF8E7",
          icon: "#D97706",
        },
        qaSummary: {
          bg: "#F3EFFC",
          icon: "#7C3AED",
        },
        flagRed: {
          bg: "#FEF2F2",
          border: "#F87171",
          text: "#DC2626",
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(13, 122, 70, 0.06)',
        'card-hover': '0 8px 30px -4px rgba(13, 122, 70, 0.12)',
        'button-green': '0 2px 8px 0 rgba(13, 122, 70, 0.20)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
