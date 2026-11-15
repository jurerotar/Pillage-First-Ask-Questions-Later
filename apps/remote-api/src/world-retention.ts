import type { AppConfig } from './config.ts';
import type { Store, Upload } from './store.ts';
import { removeUploadFiles } from './upload-files.ts';

export const sharedWorldLifetimeMs = 24 * 60 * 60 * 1000;

export const isWorldUploadExpired = (upload: Upload): boolean =>
  upload.worldId !== null &&
  upload.createdAt + sharedWorldLifetimeMs <= Date.now();

export const cleanupExpiredWorlds = async (
  config: AppConfig,
  store: Store,
): Promise<void> => {
  const worldIds = store.listExpiredWorldIds(
    Date.now() - sharedWorldLifetimeMs,
  );

  for (const worldId of worldIds) {
    try {
      const upload = store.getUploadForWorld(worldId);

      if (upload) {
        await removeUploadFiles(config, upload);
      }

      store.deleteWorld(worldId, 'expired');
    } catch (error) {
      // Keep metadata so failed file deletions are retried on the next sweep.
      console.error('Unable to delete expired shared world', worldId, error);
    }
  }
};
