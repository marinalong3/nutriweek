/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#4CAF50',
          'green-dark': '#2E7D32',
          'green-light': '#81C784',
          blue: '#56CFE1',
          dark: '#0D1B2A',
          'dark-2': '#1a2e1a',
          cream: '#F9F9F4',
          orange: '#FF7043',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    }
  },
  plugins: []
}
