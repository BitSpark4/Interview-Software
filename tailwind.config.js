/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          hover:   '#1D4ED8',
          light:   'rgba(37,99,235,0.12)',
        },
        gold: {
          DEFAULT: '#F59E0B',
          hover:   '#D97706',
          light:   'rgba(245,158,11,0.12)',
        },
        page:        '#0A0F1E',
        sidebar:     '#0F172A',
        card:        '#111827',
        'card-hover':'#1E293B',
      },
    },
  },
  plugins: [],
}
