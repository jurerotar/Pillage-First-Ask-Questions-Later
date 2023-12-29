import { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  darkMode: 'class',
  content: [
    './public/index.html',
    './src/**/*.tsx',
    './src/utils/game/color-maps.ts',
  ],
  theme: {
    fontFamily: {
      sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
    },
    screens: {
      xs: '425px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        'permanent-marker': ['Permanent Marker', 'sans-serif'],
      },
      duration: {
        default: 300,
      },
      backdropBlur: {
        xs: '1px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        ...defaultTheme.colors,
        resources: {
          wood: '#426002',
          iron: '#7B90A1',
          clay: '#C29760',
          wheat: '#FFF600',
        },
        reputation: {
          player: '#4338ca',
          ecstatic: '#1d4ed8',
          respected: '#0891b2',
          friendly: '#22c55e',
          neutral: '#facc15',
          unfriendly: '#f97316',
          hostile: '#e11d48'
        },
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('accessible', ':merge(.accessible):hover &');
      addVariant('reduced-motion', ':merge(.reduced-motion):first-child &');
      // :merge() is important to merge all variant pseudos on that selector and not the child
      // this is inspirted by the core .group plugin https://github.com/tailwindlabs/tailwindcss/blob/master/src/corePlugins.js#L107
    }),
  ],
} satisfies Config;
