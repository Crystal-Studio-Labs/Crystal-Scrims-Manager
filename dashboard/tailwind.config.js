/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#090B10',
          card: '#11141D',
          hover: '#181C28',
          border: '#27272A',
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
        'brutal-cyan': '4px 4px 0px #00F0FF',
        'brutal-lime': '4px 4px 0px #39FF14',
        'brutal-pink': '4px 4px 0px #FF0055',
      },
    },
  },
  plugins: [],
}
