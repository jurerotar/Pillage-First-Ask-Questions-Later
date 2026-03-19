import { useMutation } from '@tanstack/react-query';
import Peer from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import type {
  ImportGameWorldWorkerPayload,
  ImportGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker';
import ImportGameWorldWorker from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker?worker&url';
import { useGameWorldActions } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import { workerFactory } from 'app/utils/workers';

type ImportGameWorldSuccess = Extract<
  ImportGameWorldWorkerResponse,
  { resolved: true }
>;

const ImportGameWorld = () => {
  const { t } = useTranslation('public');
  const navigate = useNavigate();
  const { createGameWorld } = useGameWorldActions();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const peerRef = useRef<Peer | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const {
    mutateAsync: importGameWorld,
    isPending: isImporting,
    error,
  } = useMutation<ImportGameWorldSuccess, Error, ArrayBuffer | Blob>({
    mutationFn: async (data) => {
      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
      const payload: ImportGameWorldWorkerPayload = {
        databaseBuffer: buffer as ArrayBuffer,
      };

      const result = await workerFactory<
        ImportGameWorldWorkerPayload,
        ImportGameWorldWorkerResponse
      >(ImportGameWorldWorker, payload);

      if (!result.resolved) {
        throw new Error(result.error || 'Failed to import game world.');
      }

      return result;
    },
    onSuccess: async ({ server }) => {
      createGameWorld({ server });

      await navigate(`/game/${server.slug}/v-1/resources`);
    },
  });

  const { mutateAsync: connectToPeer, isPending: isConnecting } = useMutation({
    mutationFn: async (targetPeerId: string) => {
      let toastId: string | number | undefined;

      return new Promise<void>((resolve, reject) => {
        if (peerRef.current) {
          peerRef.current.destroy();
        }
        const peer = new Peer({
          debug: 2,
        });
        peerRef.current = peer;

        peer.on('open', () => {
          toastId = toast.loading('Connecting to device...');
          const conn = peer.connect(targetPeerId, {
            reliable: true,
          });

          conn.on('open', () => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          });

          conn.on('data', async (data) => {
            if (
              !(
                data instanceof Blob ||
                data instanceof ArrayBuffer ||
                ArrayBuffer.isView(data)
              )
            ) {
              if (toastId) {
                toast.dismiss(toastId);
              }
              console.error('Received invalid data format:', data);
              toast.error('Received invalid data format.', {
                description: `Received: ${typeof data}`,
              });
              peer.destroy();
              reject(new Error('Received invalid data format.'));
              return;
            }

            const buffer =
              data instanceof Blob ? await data.arrayBuffer() : data;

            if (toastId) {
              toast.dismiss(toastId);
            }
            toast.success('Game world received!');
            peer.destroy();
            peerRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            try {
              await importGameWorld(buffer as ArrayBuffer);
              resolve();
            } catch (e) {
              reject(e);
            }
          });

          conn.on('error', (err) => {
            if (toastId) {
              toast.dismiss(toastId);
            }
            toast.error('Failed to connect', {
              description: err.message,
            });
            peer.destroy();
            peerRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            reject(err);
          });

          // Timeout for connection
          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            if (!conn.open) {
              if (toastId) {
                toast.dismiss(toastId);
              }
              toast.error(
                'Connection timed out. Ensure the sharing device is still active.',
              );
              peer.destroy();
              peerRef.current = null;
              reject(new Error('Connection timed out.'));
            }
          }, 30000);
        });

        peer.on('error', (err) => {
          if (toastId) {
            toast.dismiss(toastId);
          }
          toast.error('Failed to connect', {
            description: err.message,
          });
          peer.destroy();
          peerRef.current = null;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          reject(err);
        });
      });
    },
  });

  const title = t('{{title}} | Pillage First!', {
    title: 'Import existing game world',
  });

  return (
    <>
      <title>{title}</title>
      <div className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="/game-worlds">
                {t('Game worlds')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Import')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text as="h1">{t('Import existing game world')}</Text>
          <Text>
            If you have an existing game state file, you may attempt to import
            it here. If import is successful, you'll be automatically redirected
            to the game world.
          </Text>
          <Alert variant="warning">
            Game world importing functionality is experimental. If you encounter
            issues, please report them in the Discord!
          </Alert>
          {error && <Alert variant="error">{error.toString()}</Alert>}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              disabled={isImporting || isConnecting}
            >
              {isImporting
                ? t('Importing...')
                : t('Select .sqlite3 file to import')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite3"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  return;
                }

                if (!file.name.endsWith('.sqlite3')) {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                  return;
                }

                try {
                  await importGameWorld(file);
                } finally {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
            />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Text
              as="h2"
              className="text-xl font-semibold"
            >
              {t('Import from other device')}
            </Text>
            <Text>
              {t(
                'Enter the Peer ID shown on your other device to transfer the game world directly.',
              )}
            </Text>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Enter Peer ID"
                value={peerId}
                onChange={(e) => setPeerId(e.target.value.toUpperCase())}
                disabled={isImporting || isConnecting}
                className="uppercase"
              />
              <Button
                onClick={() => connectToPeer(peerId)}
                disabled={!peerId || isImporting || isConnecting}
              >
                {isConnecting ? t('Connecting...') : t('Connect')}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Text>{t('Want to create a new game world instead?')}</Text>

            <Link to="/game-worlds/create">
              <Button variant="outline">{t('Create a new game world')}</Button>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default ImportGameWorld;
