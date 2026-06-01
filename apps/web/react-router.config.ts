import type { Config } from '@react-router/dev/config';
import {
  createSPAPagesWithPreloads,
  deleteSPAPreloadPage,
  generateStaticFeeds,
  replaceReactIconsSpritePlaceholdersOnPreRenderedPages,
} from './scripts/react-router-build-end-hook-scripts';

const publicPagesToPrerender = [
  '/',
  '/game-worlds',
  '/game-worlds/create',
  '/game-worlds/import',
  '/frequently-asked-questions',
  '/get-involved',
  '/latest-updates',
  '/404',
];

const prerenderPaths = [...publicPagesToPrerender, '/__spa-preload'];

const reactRouterConfig: Config = {
  ssr: false,
  subResourceIntegrity: false,
  prerender: {
    concurrency: 1,
    paths: prerenderPaths,
  },
  future: {
    v8_middleware: true,
    unstable_optimizeDeps: true,
    v8_viteEnvironmentApi: true,
    v8_splitRouteModules: 'enforce',
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
  buildEnd: async (args) => {
    await createSPAPagesWithPreloads(args);
    await replaceReactIconsSpritePlaceholdersOnPreRenderedPages(args);
    await deleteSPAPreloadPage(args);
    await generateStaticFeeds(args);
  },
};

export default reactRouterConfig;
