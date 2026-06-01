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
          50:  '#eaf2f8',
          100: '#d4e6f1',
          200: '#a9cce3',
          300: '#7fb3d5',
          400: '#5499c7',
          500: '#2980b9',
          600: '#1a5276',
          700: '#154360',
          800: '#0f344a',
          900: '#0a2534',
        },
      },
    },
  },
  plugins: [],
};
