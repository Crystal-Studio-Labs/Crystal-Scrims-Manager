/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          deep: '#050507',
          DEFAULT: '#090B10',
          card: '#0D0F16',
          hover: '#151924',
          border: '#1E2330',
        },
        cyber: {
          cyan: '#00F0FF',
          lime: '#39FF14',
          yellow: '#FFDF00',
          pink: '#FF0055',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        brutal: '4px 4px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
        'brutal-cyan': '4px 4px 0px #00F0FF',
        'brutal-lime': '4px 4px 0px #39FF14',
        'brutal-pink': '4px 4px 0px #FF0055',
        'brutal-yellow': '4px 4px 0px #FFDF00',
        'brutal-white': '4px 4px 0px #FFFFFF',
      },
    },
  },
  plugins: [],
}
