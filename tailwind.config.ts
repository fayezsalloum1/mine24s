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
        navy: {
          900: "#0a0f1e",
          800: "#0d1428",
          700: "#111827",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
        },
        profit: "#10b981",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-cairo)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 40px -8px rgb(245 158 11 / 0.35)",
        "gold-sm": "0 4px 20px -4px rgb(245 158 11 / 0.3)",
        profit: "0 0 40px -8px rgb(16 185 129 / 0.3)",
        glass: "0 8px 32px -8px rgb(0 0 0 / 0.5)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgb(245 158 11 / 0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 80% 80%, rgb(16 185 129 / 0.08), transparent 50%), linear-gradient(180deg, #0a0f1e 0%, #0d1428 100%)",
        "grid-pattern":
          "linear-gradient(rgb(255 255 255 / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.03) 1px, transparent 1px)",
        "dot-pattern":
          "radial-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
        dot: "24px 24px",
      },
      animation: {
        "gradient-shift": "gradient-shift 8s ease infinite",
        "fade-up": "fade-up 0.5s ease-out",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
