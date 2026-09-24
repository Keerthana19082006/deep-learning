/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030D09',
          900: '#05130E',
          800: '#0E231B',
          700: '#17372B',
          600: '#224D3C'
        },
        cyan: {
          200: '#A7F3D0',
          300: '#34D399',
          400: '#10B981',
          500: '#059669',
          600: '#047857',
          950: '#022C22'
        }
      }
    },
  },
  plugins: [],
}

