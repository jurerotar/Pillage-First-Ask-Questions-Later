const plugin = require('tailwindcss/plugin');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    "./public/index.html",
    "./src/**/*.tsx",
  ],
  theme: {
    fontFamily: {
      'sans': ['Montserrat', ...defaultTheme.fontFamily.sans],
    },
    screens: {
      'xs': '425px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        'permanent-marker': ['Permanent Marker', 'sans-serif']
      },
      duration: {
        default: 300
      },
      backdropBlur: {
        'xs': '1px'
      },
      colors: {
        ...defaultTheme.colors,
        resources: {
          wood: '#426002',
          iron: '#7B90A1',
          clay: '#C29760',
          wheat: '#FFF600'
        },
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
      },
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
