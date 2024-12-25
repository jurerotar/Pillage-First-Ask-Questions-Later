import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import reactIconsTailwindcssPlugin from 'react-icons-tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '425px',
        '2xl': '1536px',
      },
      colors: {
        reputation: {
          player: '#4338ca',
          ecstatic: '#1d4ed8',
          respected: '#0891b2',
          friendly: '#22c55e',
          neutral: '#facc15',
          unfriendly: '#f97316',
          hostile: '#e11d48',
        },
      },
    },
  },
  plugins: [
    reactIconsTailwindcssPlugin,
    plugin(({ addVariant }) => {
      addVariant('night', ':is(:where(.time-of-day-night) &)');
    }),
    plugin(({ addVariant }) => {
      addVariant('day', ':is(:where(.time-of-day-day) &)');
    }),
  ],
} satisfies Config;
