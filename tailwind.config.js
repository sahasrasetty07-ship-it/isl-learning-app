/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Saket design system tokens
        canvas: '#F4F5FA',
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9',
        },
        border: {
          DEFAULT: '#e2e8f0',
          subtle: '#f1f5f9',
          strong: '#cbd5e1',
        },
        line: '#E1E3EE',
        ink: {
          DEFAULT: '#1A1D3A',
          muted: '#565A78',
          subtle: '#94a3b8',
        },
        action: { DEFAULT: '#C2410C', hover: '#9A3412', soft: '#FFF1E8' },
        accent: {
          DEFAULT: '#d97706',
          hover: '#b45309',
          subtle: '#fef3c7',
          muted: '#fffbeb',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gujarati: {
          DEFAULT: '#C2410C',
          soft: '#FFF1E8',
          saffron: '#FF6F00',
          green: '#2E7D32',
          teal: '#00838F',
          gold: '#FFB300',
          dark: '#1E293B',
        },
        maths: { DEFAULT: '#3B3FBF', soft: '#EEEFFB' },
        science: { DEFAULT: '#0F766E', soft: '#E7F4F2' },
        success: { DEFAULT: '#15803D', soft: '#ECF7EF' },
        danger: { DEFAULT: '#BE185D', soft: '#FCEEF4' },
        pad: {
          paper: '#FBF8F3',
          ink: '#1A1D3A',
          saffron: '#C2410C',
          'saffron-dark': '#9A3412',
          pass: '#15803D',
          wrong: '#BE185D',
        }
      },
      fontFamily: {
        sans: ['"Mukta Vaani"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
        heading: ['"Baloo Bhai 2"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
        baloo: ['"Baloo Bhai 2"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
        mukta: ['"Mukta Vaani"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [],
}
