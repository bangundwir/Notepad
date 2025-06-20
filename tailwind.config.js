/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      colors: {
        'notepad': {
          bg: '#1e1e1e',
          text: '#d4d4d4',
          border: '#3e3e3e',
          accent: '#007acc',
        }
      }
    },
  },
  plugins: [],
} 