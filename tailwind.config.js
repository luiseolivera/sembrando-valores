/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        morado: {
          DEFAULT: '#6B21A8',
          light: '#9333EA',
          dark: '#4C1D95',
        },
        dorado: {
          DEFAULT: '#EAB308',
          light: '#FDE047',
          dark: '#CA8A04',
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
