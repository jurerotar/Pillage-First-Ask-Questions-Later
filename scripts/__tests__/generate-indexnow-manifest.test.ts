import { describe, expect, test } from 'vitest';
import {
  getPublicPathsForFiles,
  PUBLIC_PATHS,
} from '../generate-indexnow-manifest';

describe('getPublicPathsForFiles', () => {
  test('maps FAQ content changes to the canonical FAQ URL', () => {
    expect(
      getPublicPathsForFiles([
        'apps/web/app/(public)/(frequently-asked-questions)/mdx/frequently-asked-questions.mdx',
      ]),
    ).toStrictEqual(['/frequently-asked-questions']);
  });

  test('maps changelog changes to latest updates', () => {
    expect(getPublicPathsForFiles(['CHANGELOG.md'])).toStrictEqual([
      '/latest-updates',
    ]);
  });

  test('queues every public URL when shared public UI changes', () => {
    expect(
      getPublicPathsForFiles(['apps/web/app/(public)/components/footer.tsx']),
    ).toStrictEqual([...PUBLIC_PATHS]);
  });

  test('ignores changes that do not affect indexable public pages', () => {
    expect(
      getPublicPathsForFiles(['packages/api/src/db/database.ts']),
    ).toStrictEqual([]);
  });
});
