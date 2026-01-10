/// <reference types="node" />

import { glob, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { load } from 'cheerio';
import { REACT_ICONS_SPRITE_URL_PLACEHOLDER } from 'react-icons-sprite';
import type { Config } from '@react-router/dev/config';
import { getGameRoutePaths } from 'app/utils/react-router';

export const createSPAPagesWithPreloads: NonNullable<
  Config['buildEnd']
> = async () => {
  const gamePagesToPrerender = getGameRoutePaths();

  const clientDir = resolve('build/client');

  const fallbackPath = join(clientDir, '__spa-fallback.html');
  const prefetchHtmlPath = join(clientDir, '__spa-preload', 'index.html');

  const [fallbackHtml, prefetchHtml] = await Promise.all([
    readFile(fallbackPath, 'utf8'),
    readFile(prefetchHtmlPath, 'utf8'),
  ]);

  const $prefetch = load(prefetchHtml);

  for (const page of gamePagesToPrerender) {
    const $fallback = load(fallbackHtml);

    const matchingLinks = $prefetch(
      `link[data-prefetch-page="${page}"]`,
    ).toArray();

    for (const el of matchingLinks) {
      const $link = $prefetch(el);
      const href = $link.attr('href');

      if (!href) {
        continue;
      }

      // Skip if a link with the same href already exists in the fallback
      const alreadyExists = $fallback(`link[href="${href}"]`).length > 0;
      if (alreadyExists) {
        continue;
      }

      $link.removeAttr('data-prefetch-page');

      if (href.endsWith('.js')) {
        $link.attr('as', 'script');
        $link.attr('crossorigin', 'anonymous');
      }

      $fallback('head').append($prefetch.html(el));
    }

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
    './build/client/react-icons-sprite-*.svg',
  )) {
    const svgSpriteName = svgSpriteFile.replace(/build[/\\]client[/\\]?/, '/');

    const preRenderedFileUrls =
      // @ts-expect-error: This type is dumb af
      (reactRouterConfig.prerender!.paths as string[]).map((path) => {
        return resolve(clientDir, `.${path}`, 'index.html');
      });

    for (const filePath of preRenderedFileUrls) {
      const content = await readFile(filePath, 'utf8');
      const updatedContent = content.replaceAll(
        REACT_ICONS_SPRITE_URL_PLACEHOLDER,
        svgSpriteName,
      );

      await writeFile(filePath, updatedContent, 'utf8');
    }
  }
};
