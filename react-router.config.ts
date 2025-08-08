import type { Config } from '@react-router/dev/config';
import { load } from 'cheerio';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const PAGES_TO_PREFETCH = [
  '/game/server-slug/village-slug/resources',
  '/game/server-slug/village-slug/resources/building-field-id',
  '/game/server-slug/village-slug/village',
  '/game/server-slug/village-slug/village/building-field-id',
  '/game/server-slug/village-slug/map',
  '/game/server-slug/village-slug/hero',
  '/game/server-slug/village-slug/preferences',
  '/game/server-slug/village-slug/statistics',
  '/game/server-slug/village-slug/overview',
  '/game/server-slug/village-slug/quests',
  '/game/server-slug/village-slug/reports',
  '/game/server-slug/village-slug/reports/report-id',
];

export default {
  ssr: false,
  prerender: [
    '/',
    '/__prerender',
    '/design-system/icons',
    '/error/403',
    '/error/404',
  ],
  future: {
    unstable_middleware: true,
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: true,
    unstable_viteEnvironmentApi: true,
    unstable_splitRouteModules: 'enforce',
  },
  buildEnd: async () => {
    const clientDir = resolve('build/client');

    const fallbackPath = join(clientDir, '__spa-fallback.html');
    const prefetchHtmlPath = join(clientDir, '__prerender', 'index.html');

    const [fallbackHtml, prefetchHtml] = await Promise.all([
      readFile(fallbackPath, 'utf8'),
      readFile(prefetchHtmlPath, 'utf8'),
    ]);

    const $prefetch = load(prefetchHtml);

    for (const page of PAGES_TO_PREFETCH) {
      const $fallback = load(fallbackHtml);

      const matchingLinks = $prefetch(
        `link[data-prefetch-page="${page}"]`,
      ).toArray();

      matchingLinks.forEach((el) => {
        $prefetch(el).removeAttr('data-prefetch-page');
        $fallback('head').append($prefetch.html(el));
      });

      const outFile = join(clientDir, `${page.replace(/^\//, '')}.html`);
      const outDir = dirname(outFile);
      await mkdir(outDir, { recursive: true });

      const outputPath = join(clientDir, page.replace(/^\//, ''), 'index.html');
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, $fallback.html(), 'utf8');
    }
  },
} satisfies Config;
