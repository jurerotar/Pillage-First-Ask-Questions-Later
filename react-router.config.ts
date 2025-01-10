import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  prerender: ['/'],
} satisfies Config;
