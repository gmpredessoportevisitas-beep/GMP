/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fef3ee',
          100: '#fde6d4',
          200: '#fcc9a8',
          300: '#fbab7a',
          400: '#f98d4d',
          500: '#FE6501',
          600: '#e55a01',
          700: '#c94f01',
          800: '#ad4401',
          900: '#913900',
        },
        negro: '#000000',
      },
    },
  },
  plugins: [],
};
