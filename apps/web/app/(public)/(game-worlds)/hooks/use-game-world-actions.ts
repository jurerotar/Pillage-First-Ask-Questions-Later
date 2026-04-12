import { useMutation } from '@tanstack/react-query';
import Peer from 'peerjs';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import type { ExportServerWorkerReturn } from 'app/(public)/workers/export-server-worker';
import ExportServerWorker from 'app/(public)/workers/export-server-worker?worker&url';
import type { ShareServerWorkerResponse } from 'app/(public)/workers/share-server-worker';
import ShareServerWorker from 'app/(public)/workers/share-server-worker?worker&url';
import { invalidateQueries } from 'app/utils/react-query';
import { workerFactory } from 'app/utils/workers';

const getRootHandle = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('pillage-first-ask-questions-later', {
    create: true,
  });
};

const deleteServerData = async (server: Server) => {
  const rootHandle = await getRootHandle();

  let sawLockedError = false;

  try {
    await rootHandle.removeEntry(server.slug, {
      recursive: true,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'NoModificationAllowedError'
    ) {
      sawLockedError = true;
    }
  }

  try {
    const legacy_jsonFileName = `${server.slug}.json`;
    await rootHandle.removeEntry(legacy_jsonFileName);
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'NoModificationAllowedError'
    ) {
      sawLockedError = true;
    }
  }

  if (sawLockedError) {
    toast.error("Server couldn't be deleted", {
      description:
        'Database file was still locked by the browser. Try again in a few seconds!',
    });
    return;
  }

  const servers: Server[] = JSON.parse(
    window.localStorage.getItem(availableServerCacheKey) ?? '[]',
  );
  window.localStorage.setItem(
    availableServerCacheKey,
    JSON.stringify(servers.filter(({ id }) => id !== server.id)),
  );
};

export const useGameWorldActions = () => {
  const peerRef = useRef<Peer | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const { mutate: createGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      const servers: Server[] = JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
      window.localStorage.setItem(
        availableServerCacheKey,
        JSON.stringify([...servers, server]),
      );
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[availableServerCacheKey]]);
    },
  });

  const { mutateAsync: exportGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      const url = new URL(ExportServerWorker, import.meta.url);
      url.searchParams.set('server-slug', server.slug);

      const result = await workerFactory<void, ExportServerWorkerReturn>(url);

      if (!result.resolved) {
        throw new Error(result.error);
      }

      const { databaseBuffer } = result;

      const blob = new Blob([databaseBuffer], {
        type: 'application/x-sqlite3',
      });

      const exportUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = exportUrl;
      a.download = `${server.slug}.sqlite3`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(exportUrl);
    },
    onError: (error) => {
      toast.error('Failed to export game world', {
        description: error.message,
      });
    },
  });

  const { mutateAsync: deleteGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: ({ server }) => deleteServerData(server),
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[availableServerCacheKey]]);
    },
  });

  const { mutateAsync: shareGameWorld } = useMutation<
    void,
    Error,
    { server: Server }
  >({
    mutationFn: async ({ server }) => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const url = new URL(ShareServerWorker, import.meta.url);
      const worker: Worker = new Worker(url, { type: 'module' });
      workerRef.current = worker;

      let toastId: string | number | undefined;

      return new Promise<void>((resolve, reject) => {
        const shortId = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        const peer = new Peer(shortId);
        peerRef.current = peer;

        let secondsRemaining = 60;

        const updateToast = (peerId: string) => {
          const description = `Share this ID with the other device: ${peerId}. This ID will expire in ${secondsRemaining}s.`;

          const toastAction = {
            label: 'Cancel',
            onClick: () => {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              toast.dismiss(toastId);
              peer.destroy();
              peerRef.current = null;
              worker.terminate();
              workerRef.current = null;
              resolve();
            },
          };

          if (toastId) {
            toast.info('Game world ready to share', {
              id: toastId,
              description,
              duration: Number.POSITIVE_INFINITY,
              action: toastAction,
            });
          } else {
            toastId = toast.info('Game world ready to share', {
              description,
              duration: Number.POSITIVE_INFINITY,
              action: toastAction,
            });
          }
        };

        peer.on('open', (peerId) => {
          updateToast(peerId);

          timerRef.current = setInterval(() => {
            secondsRemaining -= 1;
            if (secondsRemaining <= 0) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              if (toastId) {
                toast.dismiss(toastId);
              }
              toast.error('Sharing connection expired');
              peer.destroy();
              peerRef.current = null;
              worker.terminate();
              workerRef.current = null;
              resolve();
            } else {
              updateToast(peerId);
            }
          }, 1000);
        });

        peer.on('connection', (conn) => {
          conn.on('error', (err) => {
            if (toastId) {
              toast.dismiss(toastId);
            }
            toast.error('Connection error', {
              description: err.message,
            });
            peer.destroy();
            peerRef.current = null;
            worker.terminate();
            workerRef.current = null;
            reject(err);
          });

          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (toastId) {
            toast.dismiss(toastId);
          }
          toastId = toast.loading('Exporting game world...');

          worker.postMessage({ serverSlug: server.slug });

          worker.onmessage = (
            event: MessageEvent<ShareServerWorkerResponse>,
          ) => {
            const response = event.data;

            if (response.type === 'database') {
              if (toastId) {
                toast.dismiss(toastId);
              }
              toastId = toast.loading('Sending game world...');

              const sendBuffer = () => {
                conn.send(response.databaseBuffer);

                setTimeout(() => {
                  if (toastId) {
                    toast.dismiss(toastId);
                  }
                  toast.success('Game world shared successfully!');
                  peer.destroy();
                  peerRef.current = null;
                  worker.terminate();
                  workerRef.current = null;
                  resolve();
                }, 1000);
              };

              if (conn.open) {
                sendBuffer();
              } else {
                conn.on('open', sendBuffer);
              }
            } else if (response.type === 'error') {
              if (toastId) {
                toast.dismiss(toastId);
              }
              toast.error('Failed to share game world', {
                description: response.message,
              });
              peer.destroy();
              peerRef.current = null;
              worker.terminate();
              workerRef.current = null;
              reject(new Error(response.message));
            }
          };
        });

        peer.on('error', (err) => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (toastId) {
            toast.dismiss(toastId);
          }
          toast.error('Failed to share game world', {
            description: err.message,
          });
          peer.destroy();
          peerRef.current = null;
          worker.terminate();
          workerRef.current = null;
          reject(err);
        });
      });
    },
  });

  return {
    createGameWorld,
    exportGameWorld,
    shareGameWorld,
    deleteGameWorld,
  };
};
