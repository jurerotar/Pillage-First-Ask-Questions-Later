import Peer, { type DataConnection } from 'peerjs';
import { useCallback, useEffect, useRef } from 'react';
import type { Server } from '@pillage-first/types/models/server';
import { useGameWorldListing } from 'app/(public)/(game-worlds)/hooks/use-game-world-listing';
import ShareServerWorker from 'app/(public)/workers/share-server-worker?worker&url';
import { getDeviceId } from 'app/utils/device';
import { workerFactory } from 'app/utils/workers';

const BROADCAST_CHANNEL = 'pillage-first-ask-questions-later';

type AvailableWorld = {
  peerId: string;
  worlds: Server[];
  deviceId?: string;
};

type Message =
  | { type: 'QUERY_WORLDS' }
  | {
      type: 'ANNOUNCE_WORLDS';
      worlds: Server[];
      peerId: string;
      deviceId?: string;
    }
  | { type: 'AVAILABLE_WORLDS_LIST'; list: AvailableWorld[] }
  | { type: 'REQUEST_WORLD'; serverSlug: string }
  | { type: 'error'; message: string };

type ShareServerInput = { serverSlug: string };

type ShareServerOutput =
  | { type: 'database'; databaseBuffer: ArrayBuffer }
  | { type: 'error'; message: string };

const withReconnect = (fn: () => void, delay = 5000) => {
  let cancelled = false;

  const retry = () => {
    if (!cancelled) {
      setTimeout(fn, delay);
    }
  };

  return {
    retry,
    cancel: () => {
      cancelled = true;
    },
  };
};

export const WebRTCAdvertiser = () => {
  const { gameWorldListing } = useGameWorldListing();
  const gameWorldListingRef = useRef(gameWorldListing);
  const peerRef = useRef<Peer | null>(null);
  const registryPeerRef = useRef<Peer | null>(null);
  const registryConnectionRef = useRef<DataConnection | null>(null);
  const activePeersRef = useRef<
    Map<string, { worlds: Server[]; deviceId?: string }>
  >(new Map());
  const registryConnectionsRef = useRef<Set<DataConnection>>(new Set());

  const createAnnounceMessage = useCallback(
    (peerId: string): Message => ({
      type: 'ANNOUNCE_WORLDS',
      worlds: gameWorldListingRef.current,
      peerId,
      deviceId: getDeviceId(),
    }),
    [],
  );

  const buildAvailableWorldsList = useCallback(
    (selfId?: string): AvailableWorld[] => {
      return Array.from(activePeersRef.current.entries())
        .filter(([peerId]) => peerId !== selfId)
        .map(([peerId, data]) => ({
          peerId,
          worlds: data.worlds,
          deviceId: data.deviceId,
        }));
    },
    [],
  );

  useEffect(() => {
    gameWorldListingRef.current = gameWorldListing;
  }, [gameWorldListing]);

  useEffect(() => {
    // 1. My unique peer for actual transfers
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      const { retry, cancel } = withReconnect(() => {
        if (peer.destroyed) {
          return;
        }
        announce();
      });

      const announce = () => {
        if (peer.destroyed) {
          return;
        }

        const conn = peer.connect(BROADCAST_CHANNEL);
        registryConnectionRef.current = conn;
        conn.on('open', () => {
          conn.send(createAnnounceMessage(id));
        });

        conn.on('error', retry);
        conn.on('close', () => {
          if (registryConnectionRef.current === conn) {
            registryConnectionRef.current = null;
          }
          retry();
        });
      };

      announce();

      return cancel;
    });

    peer.on('connection', (conn) => {
      conn.on('data', async (data) => {
        const message = data as Message;
        if (message.type === 'QUERY_WORLDS') {
          conn.send(createAnnounceMessage(peer.id));
        } else if (message.type === 'REQUEST_WORLD') {
          try {
            const result = await workerFactory<
              ShareServerInput,
              ShareServerOutput
            >(ShareServerWorker, { serverSlug: message.serverSlug });

            if (result.type === 'database') {
              conn.send(result.databaseBuffer);
            } else {
              conn.send({ type: 'error', message: result.message });
            }
          } catch (error) {
            console.error('[WebRTCAdvertiser] Failed to share world:', error);
            conn.send({ type: 'error', message: 'Failed to share world.' });
          }
        }
      });
    });

    // 2. Try to become the registry
    const registryPeer = new Peer(BROADCAST_CHANNEL);
    registryPeerRef.current = registryPeer;

    registryPeer.on('error', (err) => {
      if (err.type !== 'unavailable-id') {
        // ID already taken is fine, another tab is the registry
      }
    });

    const connections = new Map<string, string>(); // conn.peer -> peerId
    const broadcast = (list: AvailableWorld[]) => {
      for (const conn of registryConnectionsRef.current) {
        if (conn.open) {
          conn.send({ type: 'AVAILABLE_WORLDS_LIST', list } satisfies Message);
        }
      }
    };

    registryPeer.on('connection', (conn) => {
      registryConnectionsRef.current.add(conn);

      conn.on('data', (data) => {
        const message = data as Message;
        if (message.type === 'ANNOUNCE_WORLDS') {
          activePeersRef.current.set(message.peerId, {
            worlds: message.worlds,
            deviceId: message.deviceId,
          });
          connections.set(conn.peer, message.peerId);

          // Notify all active connections about the updated list
          broadcast(buildAvailableWorldsList(registryPeer.id));
        } else if (message.type === 'QUERY_WORLDS') {
          conn.send({
            type: 'AVAILABLE_WORLDS_LIST',
            list: buildAvailableWorldsList(registryPeer.id),
          } satisfies Message);
        }
      });

      conn.on('close', () => {
        registryConnectionsRef.current.delete(conn);

        const peerId = connections.get(conn.peer);
        if (peerId) {
          activePeersRef.current.delete(peerId);
          connections.delete(conn.peer);

          // Broadcast update
          broadcast(buildAvailableWorldsList(registryPeer.id));
        }
      });

      conn.on('error', () => {
        registryConnectionsRef.current.delete(conn);
      });
    });

    return () => {
      peerRef.current?.destroy();
      registryPeerRef.current?.destroy();
    };
  }, [createAnnounceMessage, buildAvailableWorldsList]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect specifically reacts to gameWorldListing changes to announce them.
  useEffect(() => {
    if (peerRef.current?.open) {
      // Find the existing connection to the registry and send update
      const existingConn = registryConnectionRef.current;

      if (existingConn?.open) {
        existingConn.send(createAnnounceMessage(peerRef.current.id));
      } else {
        const conn = peerRef.current.connect(BROADCAST_CHANNEL);
        registryConnectionRef.current = conn;
        conn.on('open', () => {
          conn.send(createAnnounceMessage(peerRef.current!.id));
        });
        conn.on('close', () => {
          if (registryConnectionRef.current === conn) {
            registryConnectionRef.current = null;
          }
        });
      }
    }
  }, [gameWorldListing, createAnnounceMessage]);

  return null;
};
