import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  prerender: ['/', '/create-new-server', '/design-system/icons', '/error'],
  future: {
    unstable_middleware: true,
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: true,
    unstable_viteEnvironmentApi: true,
    unstable_splitRouteModules: 'enforce',
  },
} satisfies Config;
