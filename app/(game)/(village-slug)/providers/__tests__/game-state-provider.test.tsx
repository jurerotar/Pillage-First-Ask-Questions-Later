import { readFileSync, statSync } from 'node:fs';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { describe, test } from 'vitest';
import 'opfs-mock';

const formatSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(3)} KB`;
  }
  if (bytes < 1024 ** 3) {
    return `${(bytes / 1024 ** 2).toFixed(3)} MB`;
  }
  return `${(bytes / 1024 ** 3).toFixed(3)} GB`;
};

// Make sure all snapshots are created with seed: 1111111111
const files = ['snapshot-21-03-2025.json', 'snapshot-22-03-2025.json', 'snapshot-11-04-2025.json'];

// These tests are skipped by default and should be only ran manually to test game-state parsing performance after changes.
// Previous snapshots are available in ./game-state-snapshots
describe('Game state OPFS-reading & parsing', () => {
  test.each(files)('run perf for %s', async (filename) => {
    const path = `app/(game)/(village-slug)/providers/__tests__/__mocks__/${filename}`;
    const data = readFileSync(path);
    const stats = statSync(path);
    const opfsFilename = filename.replace('.json', '');

    const rootDir = await getRootHandle();
    const fileHandle = await rootDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    let time = 0;
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await getParsedFileContents(rootDir, opfsFilename);
      time += performance.now() - start;
    }

    // biome-ignore lint/suspicious/noConsole: Used in testing
    console.log(
      `${opfsFilename}: total=${time.toFixed(2)}ms, avg=${(time / iterations).toFixed(2)}ms, JSON size ${formatSize(stats.size)} bytes`,
    );
  });
});
