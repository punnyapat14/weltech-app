/** @type {import('tailwindcss').Config} */
export default {
  // ✅ เพิ่มตรงนี้: เพื่อให้สลับโหมดมืด/สว่างผ่านการใส่ class 'dark' ที่ root element
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
      // แนะนำเพิ่มเติม: เพิ่ม breakpoints หรือ colors ที่จำเป็นสำหรับเครื่องมือแพทย์
      colors: {
        medical: {
          dark: '#0f172a', // slate-900
          card: '#1e293b', // slate-800
        }
      }
    },
  },
  plugins: [],
}