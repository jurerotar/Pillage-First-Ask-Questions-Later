import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE_ORIGIN = 'https://pillagefirst.com';
const OUTPUT_FILE = resolve(
  'apps/web/build/client/.well-known/indexnow-urls.json',
);

export const PUBLIC_PATHS = [
  '/',
  '/game-worlds',
  '/game-worlds/create',
  '/game-worlds/import',
  '/frequently-asked-questions',
  '/get-involved',
  '/latest-updates',
] as const;

const routeDirectories = new Map<string, readonly string[]>([
  ['(index)', ['/']],
  ['(frequently-asked-questions)', ['/frequently-asked-questions']],
  ['(get-involved)', ['/get-involved']],
  ['(latest-updates)', ['/latest-updates']],
  ['(game-worlds)/(index)', ['/game-worlds']],
  ['(game-worlds)/(create)', ['/game-worlds/create']],
  ['(game-worlds)/(import)', ['/game-worlds/import']],
]);

const affectsEveryPublicPage = (file: string) =>
  [
    'apps/web/app/(public)/components/',
    'apps/web/app/(public)/constants/',
    'apps/web/app/(public)/hooks/',
    'apps/web/app/(public)/layout.tsx',
    'apps/web/app/root.tsx',
    'apps/web/app/routes.ts',
    'apps/web/app/styles/',
    'apps/web/react-router.config.ts',
  ].some((path) => file.startsWith(path));

export const getPublicPathsForFiles = (files: readonly string[]) => {
  const publicPaths = new Set<string>();

  for (const file of files.map((path) => path.replaceAll('\\', '/'))) {
    if (affectsEveryPublicPage(file)) {
      return [...PUBLIC_PATHS];
    }

    if (file === 'CHANGELOG.md' || file === 'apps/web/app/utils/changelog.ts') {
      publicPaths.add('/latest-updates');
    }

    if (!file.startsWith('apps/web/app/(public)/')) {
      continue;
    }

    for (const [directory, paths] of routeDirectories) {
      if (file.includes(`/${directory}/`)) {
        for (const path of paths) {
          publicPaths.add(path);
        }
      }
    }
  }

  return [...publicPaths];
};

const getChangedFiles = () => {
  const commitRef = process.env.COMMIT_REF;
  // This script runs after Turbo, so the variable does not affect task caching.
  // biome-ignore lint/suspicious/noUndeclaredEnvVars: Netlify-provided build metadata
  const cachedCommitRef = process.env.CACHED_COMMIT_REF;

  if (!commitRef) {
    return [];
  }

  const gitArgs =
    cachedCommitRef && cachedCommitRef !== commitRef
      ? ['diff', '--name-only', cachedCommitRef, commitRef]
      : ['show', '--pretty=format:', '--name-only', commitRef];

  return execFileSync('git', gitArgs, { encoding: 'utf8' })
    .split(/\r?\n/u)
    .filter(Boolean);
};

export const writeIndexNowManifest = () => {
  const paths = getPublicPathsForFiles(getChangedFiles());
  const urls = paths.map((path) => new URL(path, SITE_ORIGIN).href);

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, `${JSON.stringify({ urls }, null, 2)}\n`, 'utf8');

  // Build logs are the only place to inspect the generated deployment manifest.
  // biome-ignore lint/suspicious/noConsole: intentional Netlify build logging
  console.log(
    urls.length
      ? `IndexNow: queued ${urls.join(', ')}`
      : 'IndexNow: no changed public URLs to queue',
  );
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  writeIndexNowManifest();
}
