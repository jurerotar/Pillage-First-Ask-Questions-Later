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
  ssr: false,
  prerender: {
    unstable_concurrency: 4,
    paths: ['/', '/__spa-preload', ...localizedPagesToPrerender],
  },
  future: {
    v8_middleware: true,
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: false,
    v8_viteEnvironmentApi: true,
    v8_splitRouteModules: 'enforce',
  },
  buildEnd: async (args) => {
    await createSPAPagesWithPreloads(args);
    await replaceReactIconsSpritePlaceholdersOnPreRenderedPages(args);
    await deleteSPAPreloadPage(args);
  },
};

export default reactRouterConfig;
