import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.tsx'],
  theme: {
    extend: {
      screens: {
        xs: '425px',
        '2xl': '1536px',
      },
      duration: {
        default: 300,
      },
      backdropBlur: {
        xs: '1px',
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
} satisfies Config;
