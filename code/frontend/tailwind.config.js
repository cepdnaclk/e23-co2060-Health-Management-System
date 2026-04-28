/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#edfffb",
          100: "#c4fff3",
          200: "#8ff9e5",
          300: "#4ce8cd",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0f766e",
          700: "#115e59"
        }
      },
      boxShadow: {
        float: "0 18px 60px rgba(2, 6, 23, 0.25)"
      }
    }
  },
  plugins: []
};
