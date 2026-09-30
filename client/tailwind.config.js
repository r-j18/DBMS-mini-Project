/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#EFE9DC',
          surface: '#F6F0E0',
          darkBg: '#16181C',
          darkSurface: '#1F2228',
          border: '#D9D0BE',
          darkBorder: '#2E323B',
        },
        navy: {
          DEFAULT: '#1F2D3D',
          dark: '#141D27',
          light: '#2B3D52',
          surface: '#26374A',
        },
        ink: {
          DEFAULT: '#1F1F1F',
          muted: '#4B4B4B',
          faint: '#7A7A7A',
          darkMuted: '#A09D95',
          light: '#F5F5F0',
        },
        stamp: {
          red: '#B3261E',
          blue: '#1E40AF',
          amber: '#B45309',
          green: '#15803D',
        },
        brass: {
          DEFAULT: '#B08D3C',
          light: '#D4B26F',
          dark: '#8C6C26',
        }
      },
      fontFamily: {
        typewriter: ['"Special Elite"', '"Courier Prime"', 'Courier', 'monospace'],
        mono: ['"Courier Prime"', 'ui-monospace', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(31, 31, 31, 0.08), 0 1px 2px rgba(31, 31, 31, 0.04)',
        'folder': '0 2px 6px rgba(31, 31, 31, 0.1), 0 1px 3px rgba(31, 31, 31, 0.06)',
        'pin': '0 3px 6px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
      }
    },
  },
  plugins: [],
}
