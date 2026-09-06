/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#fdf8f3',
        surface: '#ffffff',
        'karmayogi-blue': '#1d5ba5',
        'karmayogi-blue-dark': '#15457e',
        'karmayogi-blue-light': '#256ec4',
        'karmayogi-saffron': '#f58220',
        'karmayogi-saffron-hover': '#e07116',
        'karmayogi-saffron-light': '#fff3e8',
        'border-soft': '#f0e6dc',
      },
    },
  },
  plugins: [],
}
