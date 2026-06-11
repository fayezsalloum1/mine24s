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
          navy: "#020b1a",
          deep: "#0a1628",
          panel: "#111827",
          gold: "#f59e0b",
          "gold-light": "#fbbf24",
          cyan: "#22d3ee",
          emerald: "#34d399",
        },
      },
      boxShadow: {
        gold: "0 0 40px -8px rgb(245 158 11 / 0.35)",
        "gold-sm": "0 4px 24px -4px rgb(245 158 11 / 0.25)",
        panel: "0 8px 32px -8px rgb(0 0 0 / 0.6)",
        glow: "0 0 60px -12px rgb(34 211 238 / 0.2)",
      },
      backgroundImage: {
        "gradient-mining": "linear-gradient(135deg, #020b1a 0%, #0a1628 50%, #020b1a 100%)",
        "gradient-gold": "linear-gradient(135deg, #d97706 0%, #fbbf24 50%, #f59e0b 100%)",
        "gradient-card": "linear-gradient(145deg, rgb(17 24 39 / 0.95) 0%, rgb(15 23 42 / 0.85) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
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
      },
    },
  },
  plugins: [],
};
export default config;
