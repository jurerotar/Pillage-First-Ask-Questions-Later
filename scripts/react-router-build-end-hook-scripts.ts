import type { Config } from '@react-router/dev/config';
import { dirname, join, resolve } from 'node:path';
import { mkdir, readFile, writeFile, rm, glob } from 'node:fs/promises';
import { load } from 'cheerio';

export const createSPAPagesWithPreloads: NonNullable<
  Config['buildEnd']
> = async () => {
  const PAGES_TO_INCLUDE_PRELOADS_ON = [
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
    '/game/server-slug/village-slug/oasis-bonus-finder',
  ];

  const clientDir = resolve('build/client');

  const fallbackPath = join(clientDir, '__spa-fallback.html');
  const prefetchHtmlPath = join(clientDir, '__spa-preload', 'index.html');

  const [fallbackHtml, prefetchHtml] = await Promise.all([
    readFile(fallbackPath, 'utf8'),
    readFile(prefetchHtmlPath, 'utf8'),
  ]);

  const $prefetch = load(prefetchHtml);

  for (const page of PAGES_TO_INCLUDE_PRELOADS_ON) {
    const $fallback = load(fallbackHtml);

    const matchingLinks = $prefetch(
      `link[data-prefetch-page="${page}"]`,
    ).toArray();

    matchingLinks.forEach((el) => {
      const $link = $prefetch(el);
      const href = $link.attr('href');

      if (!href) {
        return;
      }

      // Skip if a link with the same href already exists in the fallback
      const alreadyExists = $fallback(`link[href="${href}"]`).length > 0;
      if (alreadyExists) {
        return;
      }

      $link.removeAttr('data-prefetch-page');

      if (href.endsWith('.js')) {
        $link.attr('as', 'script');
        $link.attr('crossorigin', 'anonymous');
      }

      $fallback('head').append($prefetch.html(el));
    });

    const outputPath = join(clientDir, page.replace(/^\//, ''), 'index.html');
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, $fallback.html());
  }
};

export const deleteSPAPreloadPage: NonNullable<
  Config['buildEnd']
> = async () => {
  const spaPreloadDir = resolve('build/client/__spa-preload');

  await rm(spaPreloadDir, { recursive: true, force: true });
};

export const replaceReactIconsSpritePlaceholdersOnPreRenderedPages: NonNullable<
  Config['buildEnd']
> = async ({ reactRouterConfig }) => {
  const clientDir = resolve('build/client');

  for await (const svgSpriteFile of glob(
    './build/client/assets/react-icons-sprite.svg',
  )) {
    const svgSpriteName = svgSpriteFile.replace('build/client', '');

    // @ts-expect-error: This type is dumb af
    const preRenderedFileUrls = (
      reactRouterConfig.prerender!.paths as string[]
    ).map((path) => {
      return resolve(clientDir, `.${path}`, 'index.html');
    });

    for (const filePath of preRenderedFileUrls) {
      const content = await readFile(filePath, 'utf8');
      const updatedContent = content.replaceAll(
        '__SPRITE_URL_PLACEHOLDER__',
        svgSpriteName,
      );

      await writeFile(filePath, updatedContent, 'utf8');
    }
  }
};
