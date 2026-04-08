/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0e1726",
        coral: "#ff6b5e",
        sky: "#5ab1ff",
        mint: "#6ad8bf",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 42px -20px rgba(14, 23, 38, 0.35)",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floatIn: "floatIn 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};
