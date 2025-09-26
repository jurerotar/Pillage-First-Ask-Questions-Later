import type { Config } from '@react-router/dev/config';
import {
  createSPAPagesWithPreloads,
  deleteSPAPreloadPage,
} from './scripts/react-router-build-end-hook-scripts';

export default {
  ssr: false,
  prerender: [
    '/',
    '/create-new-server',
    '/frequently-asked-questions',
    '/__spa-preload',
  ],
  future: {
    v8_middleware: true,
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: false,
    unstable_viteEnvironmentApi: true,
    unstable_splitRouteModules: 'enforce',
  },
  buildEnd: async (args) => {
    await createSPAPagesWithPreloads(args);
    await deleteSPAPreloadPage(args);
  },
} satisfies Config;
