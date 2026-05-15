import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      animation: {
        "fade-in": "fade-in 180ms ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        "slide-up": "slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1) both"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.08)",
        "card-dark": "0 1px 2px rgba(0, 0, 0, 0.22), 0 18px 42px rgba(0, 0, 0, 0.28)",
        "focus-ring": "0 0 0 4px rgba(31, 122, 91, 0.16)"
      },
      colors: {
        brass: "#f4b942",
        felt: "#167857",
        ink: "#111827"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
