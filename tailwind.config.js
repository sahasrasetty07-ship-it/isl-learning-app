/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Saket design system — one palette for student, teacher and parent
        canvas: '#F4F5FA',
        surface: '#FFFFFF',
        ink: { DEFAULT: '#1A1D3A', muted: '#565A78' },
        line: '#E1E3EE',
        // The one action colour (white text on it passes 4.5:1)
        action: { DEFAULT: '#C2410C', hover: '#9A3412', soft: '#FFF1E8' },
        // Fixed subject colours
        gujarati: { DEFAULT: '#C2410C', soft: '#FFF1E8' },
        maths: { DEFAULT: '#3B3FBF', soft: '#EEEFFB' },
        science: { DEFAULT: '#0F766E', soft: '#E7F4F2' },
        // Feedback states (always paired with an icon or text, never colour alone)
        success: { DEFAULT: '#15803D', soft: '#ECF7EF' },
        danger: { DEFAULT: '#BE185D', soft: '#FCEEF4' },
        // Writing pad palette
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
