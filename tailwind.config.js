/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#8697ff",
        "background-light": "#e7ecf1",
        "background-dark": "#202530",
        "component-light": "#FFFFFF",
        "component-dark": "#1C1C1E",
        "text-primary-light": "#1C1C1E",
        "text-primary-dark": "#FFFFFF",
        "text-secondary-light": "#8A8A8E",
        "text-secondary-dark": "#8E8E93",
        positive: "#51fd8f",
        negative: "#dc252e",
        income: "#f5f934"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0, 0, 0, 0.05)"
      }
    }
  },
  plugins: [],
}
