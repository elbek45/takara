/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        takara: {
          dark: '#0A2F23',
          green: '#1A4D3A',
          gold: '#D4AF37',
          'gold-light': '#FFD700',
        },
      },
      fontFamily: {
        japanese: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
