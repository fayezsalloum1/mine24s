import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        mining: {
          void: "#01050d",
          navy: "#020b1a",
          deep: "#0a1628",
          panel: "#0d1424",
          gold: "#f5a623",
          "gold-light": "#ffd166",
          cyan: "#22d3ee",
          emerald: "#10b981",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
        display: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.2em",
      },
      boxShadow: {
        gold: "0 0 48px -8px rgb(245 166 35 / 0.45)",
        "gold-sm": "0 4px 28px -4px rgb(245 166 35 / 0.35)",
        panel: "0 12px 40px -12px rgb(0 0 0 / 0.75)",
        glow: "0 0 80px -16px rgb(34 211 238 / 0.25)",
        iconic: "0 0 0 1px rgb(255 255 255 / 0.04), 0 24px 48px -24px rgb(0 0 0 / 0.8)",
      },
      backgroundImage: {
        "gradient-mining": "linear-gradient(135deg, #01050d 0%, #0a1628 50%, #01050d 100%)",
        "gradient-gold": "linear-gradient(135deg, #ffd166 0%, #f5a623 45%, #e8860b 100%)",
        "gradient-card": "linear-gradient(160deg, rgb(13 20 36 / 0.98) 0%, rgb(8 12 24 / 0.92) 100%)",
        "gradient-mesh": "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(245 166 35 / 0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgb(34 211 238 / 0.06), transparent 50%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
