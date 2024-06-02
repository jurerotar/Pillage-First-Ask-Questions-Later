import { useEvents } from 'app/[game]/hooks/use-events';
import { createContext, type FCWithChildren, useContext, useEffect, useRef } from 'react';
import type { SyncWorkerType } from 'app/[public]/workers/sync-worker';
import SyncWorker from 'app/[public]/workers/sync-worker?worker&url';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';

type GameEngineProviderReturn = {
  syncWorker: SyncWorkerType;
};

const GameEngine = createContext<GameEngineProviderReturn>({} as never);

export const GameEngineProvider: FCWithChildren = ({ children }) => {
  const { serverId } = useCurrentServer();
  const { events, resolveEvent } = useEvents();

  const syncWorker = useRef<SyncWorkerType | null>(null);

  useEffect(() => {
    // This is a little hacky, but the idea is to add server-id as a search param, which then allows us to not send it with messages
    const workerUrl = new URL(SyncWorker, window.location.origin);
    workerUrl.searchParams.append('server-id', serverId);

    syncWorker.current = new Worker(workerUrl.href, { type: 'module' });

    return () => {
      if (syncWorker.current) {
        syncWorker.current.terminate();
      }
    };
  }, [serverId]);

  const timeoutId = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }

    const alreadyResolvedEvents = events.filter(({ resolvesAt }) => resolvesAt <= Date.now());

    for (const { id } of alreadyResolvedEvents) {
      resolveEvent(id);
    }

    const unresolvedEvents = events.filter(({ resolvesAt }) => resolvesAt > Date.now());

    if (unresolvedEvents.length < 1) {
      return;
    }

    const { id, resolvesAt } = unresolvedEvents[0];

    timeoutId.current = window.setTimeout(() => {
      resolveEvent(id);
    }, resolvesAt - Date.now());

    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
    };
  }, [events, resolveEvent]);

  return <GameEngine.Provider value={{ syncWorker: syncWorker.current! }}>{children}</GameEngine.Provider>;
};

export const useGameEngine = () => useContext(GameEngine);
