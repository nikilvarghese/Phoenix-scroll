/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#FDFBF7',
          warm: '#F7F3E9',
          card: '#FFFFFF',
          text: '#2C2724',
          subtle: '#6E6760',
          border: '#E8E2D7',
          accent: '#A855F7',
          brand: '#8B4513',
        },
        parchment: {
          bg: '#FBF7EE',
          text: '#2C2523',
          card: '#F5EFE0',
          border: '#E3D7BF',
        },
        night: {
          bg: '#121316',
          card: '#1B1D22',
          text: '#E2E8F0',
          subtle: '#94A3B8',
          border: '#2A2D35',
        },
        sepia: {
          bg: '#F4ECD8',
          card: '#EADFC4',
          text: '#3D3126',
          subtle: '#7A6B58',
          border: '#D8C9AA',
        }
      },
      fontFamily: {
        garamond: ['"EB Garamond"', 'Georgia', 'serif'],
        lora: ['Lora', 'Georgia', 'serif'],
        playfair: ['"Playfair Display"', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        book: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'book-hover': '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
