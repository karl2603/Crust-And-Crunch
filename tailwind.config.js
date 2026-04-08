// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cc-brown': '#1a120b',
        'cc-beige': '#f5e6d3',
        'cc-cream': '#fcfbf8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      transitionTimingFunction: {
        'lux': 'cubic-bezier(0.85, 0, 0.15, 1)', // Smooth, premium easing
      }
    },
  },
  plugins: [],
}