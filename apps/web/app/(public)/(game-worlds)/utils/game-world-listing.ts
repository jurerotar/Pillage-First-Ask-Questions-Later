import type { Server } from '@pillage-first/types/models/server';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';
import {
  availableServerCacheKey,
  starredServerIdsCacheKey,
} from 'app/(public)/constants/query-keys';
import { reportError } from 'app/instrumentation/report-error';

const gameWorldOpfsDirectory = 'pillage-first-ask-questions-later';

export const getStarredServerIds = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const starredServerIds: unknown = JSON.parse(
      window.localStorage.getItem(starredServerIdsCacheKey) ?? '[]',
    );

    return Array.isArray(starredServerIds)
      ? starredServerIds.filter(
          (serverId): serverId is string => typeof serverId === 'string',
        )
      : [];
  } catch {
    return [];
  }
};

export const sortGameWorldsByStarred = (
  servers: Server[],
  starredServerIds: string[],
): Server[] => {
  const starredServerIdSet = new Set(starredServerIds);

  return servers.toSorted(
    (a, b) =>
      Number(starredServerIdSet.has(b.id)) -
      Number(starredServerIdSet.has(a.id)),
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

    return sortGameWorldsByStarred(servers, getStarredServerIds());
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
