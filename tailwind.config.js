const plugin = require('tailwindcss/plugin');

module.exports = {
  darkMode: 'class',
  content: [
    "./public/index.html",
    "./src/**/*.tsx",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {},
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
