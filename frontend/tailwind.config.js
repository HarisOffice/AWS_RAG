/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      listStyleType: {
        'upper-roman': 'upper-roman',
        'lower-roman': 'lower-roman',
      },
    },
  },
  plugins: [],
}

