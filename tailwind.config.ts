import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f6f3ed",
        ink: "#161513",
        coral: "#ff6b3d",
        lagoon: "#0f766e",
        cream: "#fffaf4",
        gold: "#f5c451"
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)"],
        sans: ["var(--font-plus-jakarta)"]
      },
      boxShadow: {
        glow: "0 20px 60px rgba(17, 24, 39, 0.10)"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at top left, rgba(255,107,61,0.18), transparent 24%), radial-gradient(circle at top right, rgba(15,118,110,0.18), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,245,238,0.9))"
      }
    }
  },
  plugins: []
};

export default config;
