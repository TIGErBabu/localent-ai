import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        trust: { DEFAULT: "#1E3A8A", dark: "#16296B", light: "#2B4ACB", soft: "#EAF0FF" },
        action: { DEFAULT: "#F59E0B", dark: "#D97706" },
      },
      boxShadow: { card: "0 1px 3px rgba(15,23,42,.08), 0 4px 14px rgba(15,23,42,.05)" },
    },
  },
  plugins: [],
};
export default config;
