import type { Config } from '@react-router/dev/config';
import {
  createSPAPagesWithPreloads,
  generateStaticFeeds,
  replaceReactIconsSpritePlaceholdersOnPreRenderedPages,
} from './scripts/react-router-build-end-hook-scripts';

const publicPagesToPrerender = [
  '/',
  '/wiki',
  '/wiki/introduction',
  '/wiki/interactions',
  '/wiki/game-worlds',
  '/wiki/villages',
  '/wiki/resources',
  '/wiki/buildings',
  '/wiki/troops',
  '/wiki/hero',
  '/wiki/map',
  '/wiki/quests',
  '/wiki/reports',
  '/game-worlds',
  '/game-worlds/create',
  '/game-worlds/import',
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
