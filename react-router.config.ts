import type { Config } from '@react-router/dev/config';
import {
  createSPAPagesWithPreloads,
  deleteSPAPreloadPage,
  replaceReactIconsSpritePlaceholdersOnPreRenderedPages,
} from './scripts/react-router-build-end-hook-scripts';

export default {
  ssr: false,
  prerender: {
    unstable_concurrency: 4,
    paths: [
      '/',
      '/game-worlds',
      '/game-worlds/create',
      '/game-worlds/import',
      '/frequently-asked-questions',
      '/get-involved',
      '/__spa-preload',
    ],
  },
  future: {
    v8_middleware: true,
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: false,
    unstable_viteEnvironmentApi: true,
    unstable_splitRouteModules: 'enforce',
  },
  buildEnd: async (args) => {
    await createSPAPagesWithPreloads(args);
    await replaceReactIconsSpritePlaceholdersOnPreRenderedPages(args);
    await deleteSPAPreloadPage(args);
  },
} satisfies Config;
