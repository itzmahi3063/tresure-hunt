/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a14",
          card: "#12121f",
          card2: "#181829"
        },
        gold: {
          DEFAULT: "#f5c542",
          dim: "#c9a233"
        },
        diamond: {
          DEFAULT: "#4fd6ff",
          glow: "#7be8ff"
        },
        accentPurple: "#8a5cf6"
      },
      boxShadow: {
        glow: "0 0 24px rgba(79,214,255,0.35)",
        goldGlow: "0 0 24px rgba(245,197,66,0.35)"
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        body: ["'Inter'", "sans-serif"]
      }
    }
  },
  plugins: []
};
