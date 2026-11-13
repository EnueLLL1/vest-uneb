/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        uneb: {
          primary: '#1e3a8a',
          primaryDark: '#172554',
          accent: '#0d9488',
          border: '#e2e8f0'
        },
        // Tokens Quizlet (espelham as variáveis de css/custom.css)
        'iris-bolt': '#4255ff',
        mist: '#d9dde8',
        tinted: '#edefff'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif']
      }
    }
  },
  plugins: []
};
