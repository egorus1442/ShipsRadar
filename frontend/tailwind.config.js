/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors (StormGeo style)
        'app-bg': '#0a0e1a',
        'app-panel': '#1a1f2e',
        'app-border': '#2a2f3e',
        'app-text': '#e5e7eb',
        'app-text-secondary': '#9ca3af',
        'app-accent': '#3b82f6',
        'app-accent-hover': '#2563eb',
      }
    },
  },
  plugins: [],
}

