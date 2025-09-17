import type { Config } from '@react-router/dev/config';
import {
  createSPAPagesWithPreloads,
  replaceReactIconsSpritePlaceholdersOnPreRenderedPages,
} from './scripts/react-router-build-end';

export default {
  ssr: false,
  prerender: [
    '/',
    '/create-new-server',
    '/en-us/',
    '/en-us/create-new-server',
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
    await replaceReactIconsSpritePlaceholdersOnPreRenderedPages(args);
  },
} satisfies Config;
