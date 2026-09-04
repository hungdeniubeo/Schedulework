/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1f1f1d",
          muted: "#6f6f69",
          faint: "#9b9b95",
        },
        line: "#e6e6e2",
        canvas: "#f6f6f3",
        panel: "#fafaf8",
        group: "#f3ebd4",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
