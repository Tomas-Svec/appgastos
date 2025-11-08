/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#22acd0",
        "background-light": "#f6f7f8",
        "background-dark": "#121d20",
        "component-light": "#FFFFFF",
        "component-dark": "#1C1C1E",
        "text-primary-light": "#1C1C1E",
        "text-primary-dark": "#FFFFFF",
        "text-secondary-light": "#8A8A8E",
        "text-secondary-dark": "#8E8E93",
        positive: "#34C759",
        negative: "#FF3B30"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px"
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0, 0, 0, 0.05)"
      }
    }
  },
  plugins: [],
}
