/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Courier New", "monospace"],
        display: ["Rajdhani", "sans-serif"],
      },
      colors: {
        cyber: {
          purple: "#a855f7",
          cyan: "#22d3ee",
          dark: "#07071a",
          darker: "#0a0a1f",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          from: { boxShadow: "0 0 10px rgba(139,92,246,0.2)" },
          to:   { boxShadow: "0 0 20px rgba(139,92,246,0.5)" },
        },
      },
      backgroundImage: {
        "grid-purple": "linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};