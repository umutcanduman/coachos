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
        bg: "#F8F7F5",
        surface: "#FFFFFF",
        "surface-2": "#FDFCFB",
        "surface-3": "#F0EDE8",
        border: "rgba(0,0,0,0.055)",
        "border-2": "rgba(0,0,0,0.09)",
        text: "#1C1A17",
        "text-2": "#72695F",
        "text-3": "#B8B0A6",
        accent: "#4A7C68",
        "accent-lt": "#EEF6F2",
        "accent-dim": "#D5EBE1",
        "accent-hover": "#3d6b58",
        "c-red": "#B83232",
        "c-red-dim": "#FEF3F3",
        "c-amber": "#A85C07",
        "c-amber-dim": "#FEF8EE",
        "c-blue": "#2558D9",
        "c-blue-dim": "#EDF3FF",
        "c-teal": "#0F766E",
        "c-teal-dim": "#F0FDFA",
        "c-purple": "#6D31D9",
        "c-purple-dim": "#F5F2FF",
      },
      fontFamily: {
        serif: ["Instrument Serif", "serif"],
        sans: ["Geist", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
