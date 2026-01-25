import type { Config } from '@react-router/dev/config';
import { locales } from 'app/localization/i18n.ts';
import {
  createSPAPagesWithPreloads,
  deleteSPAPreloadPage,
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

const localizedPagesToPrerender = locales.flatMap((locale) => {
  return publicPagesToPrerender.map((page) => `/${locale}${page}`);
});

const reactRouterConfig: Config = {
  ssr: true,
  prerender: {
    unstable_concurrency: 4,
    paths: [
      ...publicPagesToPrerender,
      ...localizedPagesToPrerender,
      '/__spa-preload',
    ],
  },
  future: {
    v8_middleware: true,
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: false,
    v8_viteEnvironmentApi: true,
    v8_splitRouteModules: 'enforce',
  },
  buildEnd: async (args) => {
    const { reactRouterConfig } = args;

    // This is used when testing the build locally. Since the pages are never pre-rendered with ssr enabled, bellow hooks throw
    if (reactRouterConfig.ssr) {
      return;
    }

    await createSPAPagesWithPreloads(args);
    await replaceReactIconsSpritePlaceholdersOnPreRenderedPages(args);
    await deleteSPAPreloadPage(args);
  },
};

export default reactRouterConfig;
