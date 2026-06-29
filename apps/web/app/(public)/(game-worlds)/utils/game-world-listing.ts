import type { Server } from '@pillage-first/types/models/server';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';

const gameWorldOpfsDirectory = 'pillage-first-ask-questions-later';

export const getGameWorldListing = (): Server[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(availableServerCacheKey) ?? '[]',
    );
  } catch {
    return [];
  }
};

const getGameWorldRootHandle =
  async (): Promise<FileSystemDirectoryHandle | null> => {
    const opfsRoot = await navigator.storage.getDirectory();

    try {
      return await opfsRoot.getDirectoryHandle(gameWorldOpfsDirectory);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return null;
      }

      throw error;
    }
  };

export const removeUnlistedGameWorldDirectories = async (
  gameWorldListing: Server[],
) => {
  const rootHandle = await getGameWorldRootHandle();

  if (!rootHandle) {
    return;
  }

  const listedGameWorldSlugs = new Set(
    gameWorldListing.map(({ slug }) => slug),
  );

  for await (const [directoryName, handle] of rootHandle.entries()) {
    if (
      handle.kind !== 'directory' ||
      listedGameWorldSlugs.has(directoryName)
    ) {
      continue;
    }

    try {
      await retryWhenFileSystemLocked(async () => {
        await rootHandle.removeEntry(directoryName, {
          recursive: true,
        });
      });
    } catch (error) {
      console.error('Failed to remove unlisted game world directory', error);
    }
  }
};
