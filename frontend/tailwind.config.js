/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface, #112235)',
        board: 'var(--color-board, #06192d)'
      }
    }
  },
  darkMode: 'class',
  plugins: []
};