/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff3ee',
          100: '#ffe6db',
          200: '#ffc9ad',
          300: '#ffa87f',
          400: '#ff7f52',
          500: '#ff551f',
          600: '#e64c1b',
          700: '#cc4317',
          800: '#a33712',
          900: '#7a2a0e',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        logo: ['PetitCochon', 'sans-serif'],
        brandname: ['BDSans', 'sans-serif'],
        tagline: ['BiroScript', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
