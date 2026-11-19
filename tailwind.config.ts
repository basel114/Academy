import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { primary: "#2457e7", secondary: "#11213d", accent: "#ffca70", neutral: "#60708a" } } }
} satisfies Config;