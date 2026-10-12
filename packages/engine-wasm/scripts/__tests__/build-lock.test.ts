import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { withBuildLock } from '../build-lock';

test('rejects overlapping builds and releases ownership after completion', async () => {
  const output = await mkdtemp(path.join(tmpdir(), 'pillage-build-lock-'));
  if (
    path.dirname(output) !== path.resolve(tmpdir()) ||
    !path.basename(output).startsWith('pillage-build-lock-')
  ) {
    throw new Error('Unexpected test workspace');
  }

  try {
    await withBuildLock(output, async () => {
      await expect(withBuildLock(output, async () => {})).rejects.toThrow(
        'Another engine build holds',
      );
    });
    await expect(
      withBuildLock(output, async () => {}),
    ).resolves.toBeUndefined();
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('failed builds release the lock without hiding their failure', async () => {
  const output = await mkdtemp(path.join(tmpdir(), 'pillage-build-lock-'));
  if (
    path.dirname(output) !== path.resolve(tmpdir()) ||
    !path.basename(output).startsWith('pillage-build-lock-')
  ) {
    throw new Error('Unexpected test workspace');
  }

  try {
    await expect(
      withBuildLock(output, async () => {
        throw new Error('Compiler failed');
      }),
    ).rejects.toThrow('Compiler failed');
    await expect(
      withBuildLock(output, async () => {}),
    ).resolves.toBeUndefined();
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
