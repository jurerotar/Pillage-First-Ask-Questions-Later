import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getGameRoutePaths } from 'app/utils/react-router.ts';

const redirectsPath = resolve(import.meta.dirname, '../../public/_redirects');

const getRedirectTargets = (): Set<string> => {
  const redirects = readFileSync(redirectsPath, 'utf8');

  return new Set(
    redirects
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(/\s+/)[1])
      .filter((target): target is string => Boolean(target)),
  );
};

describe('Netlify redirects', () => {
  test('contain every prerendered game path', () => {
    const redirectTargets = getRedirectTargets();

    const missingGamePaths = getGameRoutePaths().filter((gamePath) => {
      return !redirectTargets.has(`${gamePath}/index.html`);
    });

    expect(missingGamePaths).toEqual([]);
  });
});
