import type { Server } from '@pillage-first/types/models/server';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';
import {
  availableServerCacheKey,
  pinnedServerIdsCacheKey,
} from 'app/(public)/constants/query-keys';
import { reportError } from 'app/instrumentation/report-error';

const gameWorldOpfsDirectory = 'pillage-first-ask-questions-later';

export const getPinnedServerIds = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const pinnedServerIds: unknown = JSON.parse(
      window.localStorage.getItem(pinnedServerIdsCacheKey) ?? '[]',
    );

    return Array.isArray(pinnedServerIds)
      ? pinnedServerIds.filter(
          (serverId): serverId is string => typeof serverId === 'string',
        )
      : [];
  } catch {
    return [];
  }
};

export const sortGameWorldsByPinned = (
  servers: Server[],
  pinnedServerIds: string[],
): Server[] => {
  const pinnedServerIdSet = new Set(pinnedServerIds);

  return servers.toSorted(
    (a, b) =>
      Number(pinnedServerIdSet.has(b.id)) - Number(pinnedServerIdSet.has(a.id)),
  );
};

export const getGameWorldListing = (): Server[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const servers = JSON.parse(
      window.localStorage.getItem(availableServerCacheKey) ?? '[]',
    );

    return sortGameWorldsByPinned(servers, getPinnedServerIds());
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
      reportError(error, 'Failed to remove unlisted game world directory', {
        directoryName,
        source: 'gameWorldListing',
      });
    }
  }
};
