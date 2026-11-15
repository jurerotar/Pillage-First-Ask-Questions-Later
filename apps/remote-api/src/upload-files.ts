import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { AppConfig } from './config.ts';
import type { Upload } from './store.ts';

export const removeUploadFiles = async (
  config: AppConfig,
  upload: Upload,
): Promise<void> => {
  const path = join(config.dataDirectory, 'uploads', upload.storageName);

  // Read-only SQLite previews can leave these behind even after closing.
  // Remove the database last so a failed deletion can still be retried.
  await rm(`${path}-wal`, { force: true });
  await rm(`${path}-shm`, { force: true });
  await rm(path, { force: true });
  await rm(join(config.dataDirectory, 'staging', `${upload.id}.part`), {
    force: true,
  });
};
