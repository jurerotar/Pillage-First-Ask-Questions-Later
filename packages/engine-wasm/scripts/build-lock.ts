import { mkdir, rmdir } from 'node:fs/promises';
import path from 'node:path';

// Serialize bundling and compilation: every stage shares the same output paths.
export const withBuildLock = async (
  output: string,
  build: () => Promise<void>,
): Promise<void> => {
  await mkdir(output, { recursive: true });
  const lock = path.join(output, '.build-lock');

  try {
    await mkdir(lock);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new Error(
        `Another engine build holds ${lock}. If it was interrupted, remove this empty directory before retrying.`,
      );
    }

    throw error;
  }

  try {
    await build();
  } finally {
    await rmdir(lock);
  }
};
