/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        morado: {
          DEFAULT: '#1E7A34',
          light: '#4CAF50',
          dark: '#145A26',
        },
        dorado: {
          DEFAULT: '#F5821F',
          light: '#FDB813',
          dark: '#C2410C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-morado', 'bg-morado-dark', 'bg-morado-light',
    'text-morado', 'text-morado-dark',
    'border-morado',
    'hover:bg-morado-dark', 'hover:bg-morado',
    'focus:ring-morado',
    'bg-dorado', 'bg-dorado-dark', 'bg-dorado-light',
    'text-dorado', 'text-dorado-dark',
    'border-dorado',
    'hover:bg-dorado-light',
    'ring-morado',
  ],
}
