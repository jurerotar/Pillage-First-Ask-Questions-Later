/// <reference types="node" />

import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { load } from 'cheerio';
import { REACT_ICONS_SPRITE_URL_PLACEHOLDER } from 'react-icons-sprite';
import { matchRoutes, type RouteObject } from 'react-router';
import type { Config } from '@react-router/dev/config';
import {
  buildItemsFromChangelog,
  parseChangelog,
  toAtomXml,
  toRssXml,
} from 'app/utils/changelog';
import { getGameRoutePaths } from 'app/utils/react-router';
import changelog from '../../../CHANGELOG.md?raw';

type BrowserManifestRoute = {
  id: string;
  parentId?: string;
  path?: string;
  index?: boolean;
  caseSensitive?: boolean;
  module: string;
  imports?: string[];
  clientActionModule?: string;
  clientLoaderModule?: string;
  hydrateFallbackModule?: string;
};

type BrowserManifest = {
  routes: Record<string, BrowserManifestRoute>;
};

type BrowserManifestRouteObject = RouteObject & {
  id: string;
  children?: BrowserManifestRouteObject[];
};

const findReactRouterBrowserManifest = async (): Promise<BrowserManifest> => {
  const manifestFiles: string[] = [];

  for await (const manifestFile of glob(
    './build/client/assets/manifest-*.js',
  )) {
    manifestFiles.push(manifestFile);
  }

  if (manifestFiles.length !== 1) {
    throw new Error(
      `Expected exactly one React Router browser manifest, found ${manifestFiles.length}`,
    );
  }

  const manifestContent = await readFile(manifestFiles[0], 'utf8');
  const manifestJson = manifestContent
    .trim()
    .replace(/^window\.__reactRouterManifest=/, '')
    .replace(/;$/, '');

  return JSON.parse(manifestJson) as BrowserManifest;
};

const createRouteTree = (
  routes: Record<string, BrowserManifestRoute>,
): BrowserManifestRouteObject[] => {
  const routesById = new Map<string, BrowserManifestRouteObject>();
  const routeTree: BrowserManifestRouteObject[] = [];

  for (const route of Object.values(routes)) {
    routesById.set(
      route.id,
      route.index
        ? {
            id: route.id,
            index: true,
            caseSensitive: route.caseSensitive,
          }
        : {
            id: route.id,
            path: route.path,
            caseSensitive: route.caseSensitive,
            children: [],
          },
    );
  }

  for (const route of routesById.values()) {
    const parentId = routes[route.id]?.parentId;

    if (parentId) {
      routesById.get(parentId)?.children?.push(route);
      continue;
    }

    routeTree.push(route);
  }

  return routeTree;
};

const getModulePreloadHrefs = (
  routes: Record<string, BrowserManifestRoute>,
  page: string,
): string[] => {
  const routeTree = createRouteTree(routes);
  const matches = matchRoutes(routeTree, page);

  if (!matches) {
    throw new Error(`Could not find React Router matches for "${page}"`);
  }

  const hrefs = matches.flatMap(({ route }) => {
    if (!route.id) {
      return [];
    }

    const manifestRoute = routes[route.id];

    if (!manifestRoute) {
      return [];
    }

    return [
      manifestRoute.module,
      manifestRoute.clientActionModule,
      manifestRoute.clientLoaderModule,
      manifestRoute.hydrateFallbackModule,
      ...(manifestRoute.imports ?? []),
    ];
  });

  return [...new Set(hrefs.filter((href): href is string => Boolean(href)))];
};

export const createSPAPagesWithPreloads: NonNullable<
  Config['buildEnd']
> = async () => {
  const gamePagesToPrerender = getGameRoutePaths();

  const clientDir = resolve('build/client');

  const fallbackPath = join(clientDir, '__spa-fallback.html');
  const [fallbackHtml, browserManifest] = await Promise.all([
    readFile(fallbackPath, 'utf8'),
    findReactRouterBrowserManifest(),
  ]);

  for (const page of gamePagesToPrerender) {
    const $fallback = load(fallbackHtml);
    const prefetchHrefs = getModulePreloadHrefs(browserManifest.routes, page);

    for (const href of prefetchHrefs) {
      // Skip if a link with the same href already exists in the fallback
      const alreadyExists = $fallback(`link[href="${href}"]`).length > 0;
      if (alreadyExists) {
        continue;
      }

      const $link = $fallback('<link>');
      $link.attr('rel', 'modulepreload');
      $link.attr('href', href);
      $link.attr('as', 'script');
      $link.attr('crossorigin', 'anonymous');

      $fallback('head').append($link);
    }

    const outputPath = join(clientDir, page.replace(/^\//, ''), 'index.html');
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, $fallback.html());
  }
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

    await Promise.all(
      preRenderedFileUrls.map(async (filePath) => {
        const content = await readFile(filePath, 'utf8');
        const updatedContent = content.replaceAll(
          REACT_ICONS_SPRITE_URL_PLACEHOLDER,
          svgSpriteName,
        );

        await writeFile(filePath, updatedContent, 'utf8');
      }),
    );
  }
};

export const generateStaticFeeds: NonNullable<
  Config['buildEnd']
> = async () => {
  const clientDir = resolve('build/client');

  const baseUrl = 'https://pillagefirst.com';

  const changelogEntries = parseChangelog(changelog);
  const items = buildItemsFromChangelog(changelogEntries, baseUrl, 30);

  const rss = toRssXml({
    title: 'Pillage First — Latest Updates',
    link: `${baseUrl}/latest-updates`,
    description:
      'Changelog feed for Pillage First — features, fixes, performance and technical improvements.',
    language: 'en-US',
    items,
  });

  const atom = toAtomXml({
    id: 'urn:pillage-first:latest-updates',
    title: 'Pillage First — Latest Updates',
    link: `${baseUrl}/latest-updates`,
    feedLink: `${baseUrl}/atom.xml`,
    updated: items[0]?.pubDate ?? new Date(),
    entries: items.map((it) => ({
      id: it.id,
      title: it.title,
      link: it.link,
      summary: it.description,
      updated: it.pubDate,
    })),
  });

  await mkdir(clientDir, { recursive: true });
  await Promise.all([
    writeFile(join(clientDir, 'rss.xml'), rss, 'utf8'),
    writeFile(join(clientDir, 'atom.xml'), atom, 'utf8'),
  ]);
};
