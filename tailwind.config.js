/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0F0F0F",
          soft: "#1A1A1A",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        surface: {
          DEFAULT: "#FAFAFA",
          raised: "#FFFFFF",
          sunken: "#F3F4F6",
          border: "#E5E7EB",
          hover: "#F9FAFB",
        },
        accent: {
          DEFAULT: "#0F0F0F",
          green: "#16A34A",
          amber: "#D97706",
          red: "#DC2626",
          blue: "#2563EB",
          purple: "#7C3AED",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)",
        modal: "0 20px 60px -10px rgba(0,0,0,0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};
