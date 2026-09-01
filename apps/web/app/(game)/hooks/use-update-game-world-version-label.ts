import { useEffect } from 'react';
import type { Server } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import { reportError } from 'app/instrumentation/report-error';

const updateGameWorldVersionLabel = (serverSlug: Server['slug']): void => {
  try {
    const servers = JSON.parse(
      window.localStorage.getItem(availableServerCacheKey) ?? '[]',
    ) as Server[];
    let wasUpdated = false;

    const updatedServers = servers.map((server) => {
      if (server.slug !== serverSlug || server.version === env.VERSION) {
        return server;
      }

      wasUpdated = true;

      return {
        ...server,
        version: env.VERSION,
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
    reportError(error, 'Failed to update game world version label', {
      serverSlug,
      source: 'useUpdateGameWorldVersionLabel',
      version: env.VERSION,
    });
  }
};

export const useUpdateGameWorldVersionLabel = (
  serverSlug: Server['slug'],
  shouldUpdate: boolean,
): void => {
  useEffect(() => {
    if (!shouldUpdate) {
      return;
    }

    updateGameWorldVersionLabel(serverSlug);
  }, [serverSlug, shouldUpdate]);
};
