/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bar-bg': '#F6F7F8',
        'bar-accent': '#FCAF17',
        'bar-dark': '#00001C',
      },
    },
  },
  plugins: [],
  important: true,
}

