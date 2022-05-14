const plugin = require('tailwindcss/plugin');
const colors = require('tailwindcss/colors')

module.exports = {
  darkMode: 'class',
  content: [
    "./public/index.html",
    "./src/**/*.tsx",
  ],
  theme: {
    screens: {
      'xs': '425px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    colors: {
      ...colors,
      brown: {
        50: '#fdf8f6',
        100: '#f2e8e5',
        200: '#eaddd7',
        300: '#e0cec7',
        400: '#d2bab0',
        500: '#bfa094',
        600: '#a18072',
        700: '#977669',
        800: '#846358',
        900: '#43302b',
      },
      burek: '#151d20'
    },
    extend: {
    },
  },
  plugins: [
    plugin(({addVariant}) => {
      addVariant('accessible', ':merge(.accessible):hover &')
      addVariant('reduced-motion', ':merge(.reduced-motion):first-child &')
      // :merge() is important to merge all variant pseudos on that selector and not the child
      // this is inspirted by the core .group plugin https://github.com/tailwindlabs/tailwindcss/blob/master/src/corePlugins.js#L107
    })
  ],
}
