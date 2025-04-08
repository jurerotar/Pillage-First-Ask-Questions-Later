import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  prerender: ['/', '/create-new-server', '/design-system/icons'],
} satisfies Config;
