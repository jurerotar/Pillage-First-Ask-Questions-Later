import type { Config } from '@react-router/dev/config';
import {
  createSPAPagesWithPreloads,
  generateStaticFeeds,
  replaceReactIconsSpritePlaceholdersOnPreRenderedPages,
} from './scripts/react-router-build-end-hook-scripts';

const publicPagesToPrerender = [
  '/',
  '/game-worlds',
  '/game-worlds/create',
  '/game-worlds/import',
  '/design-system/icons',
  '/frequently-asked-questions',
  '/get-involved',
  '/latest-updates',
  '/not-found',
];

const reactRouterConfig: Config = {
  ssr: false,
  subResourceIntegrity: false,
  splitRouteModules: 'enforce',
  prerender: {
    concurrency: 1,
    paths: publicPagesToPrerender,
  },
  future: {
    unstable_optimizeDeps: true,
  },
  buildEnd: async (args) => {
    await createSPAPagesWithPreloads(args);
    await replaceReactIconsSpritePlaceholdersOnPreRenderedPages(args);
    await generateStaticFeeds(args);
  },
};

export default reactRouterConfig;
