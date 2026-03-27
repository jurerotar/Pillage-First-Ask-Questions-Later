import { useQuery, useQueryClient } from '@tanstack/react-query';
import Peer from 'peerjs';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { useGameWorldListing } from 'app/(public)/(game-worlds)/hooks/use-game-world-listing';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Spinner } from 'app/components/ui/spinner';

const BROADCAST_CHANNEL = 'pillage-first-ask-questions-later';

type AvailableWorld = {
  peerId: string;
  worlds: Server[];
};

type Message =
  | { type: 'QUERY_WORLDS' }
  | { type: 'AVAILABLE_WORLDS_LIST'; list: AvailableWorld[] }
  | { type: 'REQUEST_WORLD'; serverSlug: string }
  | { type: 'error'; message: string };

type ImportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (buffer: ArrayBuffer) => Promise<void>;
};

export const ImportModal = ({
  open,
  onOpenChange,
  onImport,
}: ImportModalProps) => {
  const { t } = useTranslation('public');
  const { gameWorldListing } = useGameWorldListing();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const peerRef = useRef<Peer | null>(null);

  const { data, isLoading } = useQuery<{
    list: AvailableWorld[];
    localPeerId: string;
  }>({
    queryKey: ['available-worlds-discovery'],
    queryFn: async ({ signal }) => {
      const peer = new Peer();
      peerRef.current = peer;

      return new Promise((resolve, reject) => {
        const cleanup = () => {
          peer.destroy();
          peerRef.current = null;
        };

        signal.addEventListener('abort', cleanup);

        let isResolved = false;

        peer.on('open', (id) => {
          const conn = peer.connect(BROADCAST_CHANNEL);

          conn.on('open', () => {
            conn.send({ type: 'QUERY_WORLDS' } satisfies Message);
          });

          conn.on('data', (data) => {
            const message = data as Message;
            if (message.type === 'AVAILABLE_WORLDS_LIST') {
              if (!isResolved) {
                isResolved = true;
                resolve({ list: message.list, localPeerId: id });
              } else {
                queryClient.setQueryData<{
                  list: AvailableWorld[];
                  localPeerId: string;
                }>(['available-worlds-discovery'], (old) => {
                  if (!old) {
                    return {
                      list: message.list,
                      localPeerId: id,
                    };
                  }
                  return { ...old, list: message.list };
                });
              }
            }
          });

          conn.on('error', (err) => {
            toast.error('Failed to discover devices.');
            reject(err);
          });
        });

        peer.on('error', (err) => {
          reject(err);
        });
      });
    },
    enabled: open,
    gcTime: 0,
    staleTime: Number.POSITIVE_INFINITY, // Don't refetch automatically
  });

  const availableWorlds = data?.list ?? [];
  const localPeerId = data?.localPeerId ?? null;

  const filteredAvailableWorlds = useMemo(() => {
    return availableWorlds
      .filter((w) => w.peerId !== localPeerId)
      .flatMap((w) =>
        w.worlds
          .filter(
            (world) => !gameWorldListing.some((local) => local.id === world.id),
          )
          .map((world) => ({ ...world, peerId: w.peerId })),
      );
  }, [availableWorlds, localPeerId, gameWorldListing]);

  const handleImport = async (peerId: string, serverSlug: string) => {
    if (!peerRef.current) {
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Connecting to device...');

    const conn = peerRef.current.connect(peerId);

    conn.on('open', () => {
      const timeoutId = setTimeout(() => {
        if (isImporting) {
          toast.error('Request timed out.', { id: toastId });
          setIsImporting(false);
          conn.close();
        }
      }, 30000); // 30s timeout

      toast.loading('Requesting game world...', { id: toastId });
      conn.send({ type: 'REQUEST_WORLD', serverSlug } satisfies Message);

      conn.on('data', async (data) => {
        clearTimeout(timeoutId);
        if (data instanceof ArrayBuffer) {
          toast.success('Game world received!', { id: toastId });
          try {
            await onImport(data);
            onOpenChange(false);
          } catch {
            toast.error('Failed to import game world.');
          } finally {
            setIsImporting(false);
            conn.close();
          }
        } else if ((data as { type?: string })?.type === 'error') {
          toast.error((data as { message: string }).message, { id: toastId });
          setIsImporting(false);
          conn.close();
        }
      });
    });

    conn.on('error', (err) => {
      toast.error('Failed to connect to device', {
        id: toastId,
        description: err.message,
      });
      setIsImporting(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Import from other devices')}</DialogTitle>
          <DialogDescription>
            {t(
              'Select a game world from another device on your network to import it.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          {isLoading && (
            <div className="flex justify-center p-8">
              <Spinner size="large" />
            </div>
          )}

          {!isLoading && filteredAvailableWorlds.length === 0 && (
            <Text className="text-center py-8 text-muted-foreground">
              {t(
                'No devices found. Make sure other devices have the game open.',
              )}
            </Text>
          )}

          {!isLoading &&
            filteredAvailableWorlds.map((world) => (
              <div
                key={`${world.peerId}-${world.slug}`}
                className="flex items-center justify-between gap-4 border rounded-md p-3"
              >
                <div className="flex flex-col">
                  <Text className="font-medium">{world.name}</Text>
                  <Text
                    variant="muted"
                    className="text-xs"
                  >
                    {world.slug} • {t('Device: {{id}}', { id: world.peerId })}
                  </Text>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleImport(world.peerId, world.slug)}
                  disabled={isImporting}
                >
                  {t('Import')}
                </Button>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
