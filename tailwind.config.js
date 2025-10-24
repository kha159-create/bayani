/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 👈 تفعيل الوضع الليلي
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
