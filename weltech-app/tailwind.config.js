/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      colors: {
        medical: {
          dark: '#0f172a', 
          card: '#1e293b', 
        }
      }
    },
  },
  plugins: [],
}