import Peer from 'peerjs';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { useGameWorldListing } from 'app/(public)/(game-worlds)/hooks/use-game-world-listing';
import ShareServerWorker from 'app/(public)/workers/share-server-worker?worker&url';
import { workerFactory } from 'app/utils/workers';

const BROADCAST_CHANNEL = 'pillage-first-ask-questions-later';

type AvailableWorld = {
  peerId: string;
  worlds: Server[];
};

type Message =
  | { type: 'QUERY_WORLDS' }
  | { type: 'ANNOUNCE_WORLDS'; worlds: Server[]; peerId: string }
  | { type: 'AVAILABLE_WORLDS_LIST'; list: AvailableWorld[] }
  | { type: 'REQUEST_WORLD'; serverSlug: string };

export const WebRTCAdvertiser = () => {
  const { gameWorldListing } = useGameWorldListing();
  const peerRef = useRef<Peer | null>(null);
  const registryPeerRef = useRef<Peer | null>(null);
  const activePeersRef = useRef<Map<string, Server[]>>(new Map());

  useEffect(() => {
    // 1. My unique peer for actual transfers
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      // Try to connect to BROADCAST_CHANNEL to announce ourselves
      const announce = () => {
        const conn = peer.connect(BROADCAST_CHANNEL);
        conn.on('open', () => {
          conn.send({
            type: 'ANNOUNCE_WORLDS',
            worlds: gameWorldListing,
            peerId: id,
          } satisfies Message);
        });

        conn.on('error', (_err) => {
          setTimeout(announce, 5000);
        });

        conn.on('close', () => {
          setTimeout(announce, 5000);
        });
      };

      announce();
    });

    peer.on('connection', (conn) => {
      conn.on('data', async (data) => {
        const message = data as Message;
        if (message.type === 'QUERY_WORLDS') {
          conn.send({
            type: 'ANNOUNCE_WORLDS',
            worlds: gameWorldListing,
            peerId: peer.id,
          } satisfies Message);
        } else if (message.type === 'REQUEST_WORLD') {
          try {
            const result = await workerFactory<
              { serverSlug: string },
              | { type: 'database'; databaseBuffer: ArrayBuffer }
              | { type: 'error'; message: string }
            >(ShareServerWorker, { serverSlug: message.serverSlug });

            if (result.type === 'database') {
              conn.send(result.databaseBuffer);
            } else {
              toast.error(result.message);
            }
          } catch (_error) {
            toast.error('Failed to share world.');
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
      const connectionsMap = (
        registryPeerRef.current as unknown as {
          connections:
            | Map<string, Peer.DataConnection[]>
            | Record<string, Peer.DataConnection[]>;
        }
      )?.connections;
      if (connectionsMap instanceof Map) {
        for (const connArray of connectionsMap.values()) {
          for (const c of connArray) {
            if (c.open) {
              c.send({
                type: 'AVAILABLE_WORLDS_LIST',
                list,
              } satisfies Message);
            }
          }
        }
      } else if (connectionsMap) {
        Object.values(connectionsMap).forEach((connArray) => {
          connArray.forEach((c) => {
            if (c.open) {
              c.send({
                type: 'AVAILABLE_WORLDS_LIST',
                list,
              } satisfies Message);
            }
          });
        });
      }
    };

    registryPeer.on('connection', (conn) => {
      conn.on('data', (data) => {
        const message = data as Message;
        if (message.type === 'ANNOUNCE_WORLDS') {
          activePeersRef.current.set(message.peerId, message.worlds);
          connections.set(conn.peer, message.peerId);

          // Notify all active connections about the updated list
          const list = Array.from(activePeersRef.current.entries())
            .filter(([peerId]) => peerId !== registryPeer.id)
            .map(([peerId, worlds]) => ({
              peerId,
              worlds,
            }));

          broadcast(list);
        } else if (message.type === 'QUERY_WORLDS') {
          const list = Array.from(activePeersRef.current.entries())
            .filter(([peerId]) => peerId !== registryPeer.id)
            .map(([peerId, worlds]) => ({
              peerId,
              worlds,
            }));
          conn.send({ type: 'AVAILABLE_WORLDS_LIST', list } satisfies Message);
        }
      });

      conn.on('close', () => {
        const peerId = connections.get(conn.peer);
        if (peerId) {
          activePeersRef.current.delete(peerId);
          connections.delete(conn.peer);

          // Broadcast update
          const list = Array.from(activePeersRef.current.entries())
            .filter(([id]) => id !== registryPeer.id)
            .map(([id, worlds]) => ({
              peerId: id,
              worlds,
            }));

          broadcast(list);
        }
      });
    });

    return () => {
      peer.destroy();
      registryPeer.destroy();
    };
  }, [gameWorldListing]);

  return null;
};
