import { useEffect } from 'react';
import type { Server } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import type { GameWorldListingEntry } from 'app/(public)/(game-worlds)/utils/game-world-listing';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import { reportError } from 'app/instrumentation/report-error';

const updateGameWorldListing = (serverSlug: Server['slug']): void => {
  try {
    const servers = JSON.parse(
      window.localStorage.getItem(availableServerCacheKey) ?? '[]',
    ) as GameWorldListingEntry[];
    let wasUpdated = false;

    const updatedServers = servers.map((server) => {
      if (server.slug !== serverSlug) {
        return server;
      }

      wasUpdated = true;

      return {
        ...server,
        version: env.VERSION,
        lastOpenedAt: Date.now(),
      };
    });

    if (!wasUpdated) {
      return;
    }

    window.localStorage.setItem(
      availableServerCacheKey,
      JSON.stringify(updatedServers),
    );
  } catch (error) {
    reportError(error, 'Failed to update game world listing', {
      serverSlug,
      source: 'useUpdateGameWorldListing',
      version: env.VERSION,
    });
  }
};

export const useUpdateGameWorldListing = (serverSlug: Server['slug']): void => {
  useEffect(() => {
    updateGameWorldListing(serverSlug);
  }, [serverSlug]);
};
