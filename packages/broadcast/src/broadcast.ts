import type { QueryClient, QueryKey } from '@tanstack/query-core';
import type { BroadcastChannelOptions } from 'broadcast-channel';
import { BroadcastChannel } from 'broadcast-channel';

type BroadcastQueryClientOptions = {
  queryClient: QueryClient;
  broadcastChannel?: string;
  options?: BroadcastChannelOptions;
  /**
   * Either:
   * - an array of string prefixes: exclude any query whose queryKey[0] equals one of these strings
   * - a predicate: (queryKey) => boolean
   */
  exclude?: string[] | ((queryKey: QueryKey) => boolean);
};

export const broadcastQueryClient = ({
  queryClient,
  broadcastChannel = 'pillage-first',
  options,
  exclude,
}: BroadcastQueryClientOptions): (() => void) => {
  let transaction = false;
  const tx = (cb: () => void) => {
    transaction = true;
    try {
      cb();
    } finally {
      transaction = false;
    }
  };

  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false,
    ...options,
  });

  const queryCache = queryClient.getQueryCache();

  // Helper to decide whether to ignore a queryKey
  const isExcluded = (queryKey: QueryKey | undefined | null) => {
    if (!queryKey) {
      return false;
    }
    if (!exclude) {
      return false;
    }

    if (typeof exclude === 'function') {
      try {
        return exclude(queryKey);
      } catch {
        // If the predicate throws, be conservative and do NOT exclude
        return false;
      }
    }

    // exclude is array of string prefixes: match first element
    if (Array.isArray(exclude)) {
      const first = (
        Array.isArray(queryKey) ? queryKey[0] : queryKey
      ) as unknown;
      // first may be non-string; only compare strings
      return exclude.some((prefix) => first === prefix);
    }

    return false;
  };

  const unsubscribe = queryCache.subscribe((queryEvent) => {
    if (transaction) {
      return;
    }

    const {
      query: { queryHash, queryKey, state, observers },
    } = queryEvent;

    // Skip excluded queries entirely
    if (isExcluded(queryKey)) {
      return;
    }

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      // state should be structured-cloneable — you excluded problematic queries already
      channel.postMessage({
        type: 'updated',
        queryHash,
        queryKey,
        state,
      });
    }

    if (queryEvent.type === 'removed' && observers.length > 0) {
      channel.postMessage({
        type: 'removed',
        queryHash,
        queryKey,
      });
    }

    if (queryEvent.type === 'added') {
      channel.postMessage({
        type: 'added',
        queryHash,
        queryKey,
      });
    }
  });

  channel.onmessage = (action: any) => {
    if (!action?.type) {
      return;
    }

    tx(() => {
      const { type, queryHash, queryKey, state } = action;

      // If this queryKey is excluded locally, ignore the incoming message
      if (isExcluded(queryKey)) {
        return;
      }

      const query = queryCache.get(queryHash);

      if (type === 'updated') {
        if (query) {
          query.setState(state);
          return;
        }

        queryCache.build(
          queryClient,
          {
            queryKey,
            queryHash,
          },
          state,
        );
      } else if (type === 'removed') {
        if (query) {
          queryCache.remove(query);
        }
      } else if (type === 'added') {
        if (query) {
          query.setState(state);
          return;
        }
        queryCache.build(
          queryClient,
          {
            queryKey,
            queryHash,
          },
          state,
        );
      }
    });
  };

  return () => {
    unsubscribe();
    channel.close();
  };
};
