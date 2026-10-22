/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e6f0fa',
          100: '#cce1f5',
          500: '#1a6abf',
          600: '#155fa8',
          700: '#104d8c',
        },
        accent: {
          500: '#17a589',
          600: '#148f76',
        }
      }
    },
  },
  plugins: [],
}
