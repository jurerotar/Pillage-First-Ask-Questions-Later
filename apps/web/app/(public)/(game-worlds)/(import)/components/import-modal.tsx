import { useQuery } from '@tanstack/react-query';
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
  | { type: 'REQUEST_WORLD'; serverSlug: string };

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

      signal.addEventListener('abort', () => {
        peer.destroy();
        peerRef.current = null;
      });

      return new Promise((resolve, reject) => {
        peer.on('open', (id) => {
          const conn = peer.connect(BROADCAST_CHANNEL);

          conn.on('open', () => {
            conn.send({ type: 'QUERY_WORLDS' } satisfies Message);
          });

          conn.on('data', (data) => {
            const message = data as Message;
            if (message.type === 'AVAILABLE_WORLDS_LIST') {
              resolve({ list: message.list, localPeerId: id });
            }
          });

          conn.on('error', (err) => {
            console.error('Peer connection error:', err);
            toast.error('Failed to discover devices.');
            reject(err);
          });
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          reject(err);
        });
      });
    },
    enabled: open,
    gcTime: 0,
    staleTime: 0,
  });

  const availableWorlds = data?.list ?? [];
  const localPeerId = data?.localPeerId ?? null;

  const filteredAvailableWorlds = useMemo(() => {
    return availableWorlds
      .filter((w) => w.peerId !== localPeerId)
      .map((w) => ({
        ...w,
        worlds: w.worlds.filter(
          (world) => !gameWorldListing.some((local) => local.id === world.id),
        ),
      }))
      .filter((w) => w.worlds.length > 0);
  }, [availableWorlds, localPeerId, gameWorldListing]);

  const handleImport = async (peerId: string, serverSlug: string) => {
    if (!peerRef.current) {
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Connecting to device...');

    const conn = peerRef.current.connect(peerId);

    conn.on('open', () => {
      toast.loading('Requesting game world...', { id: toastId });
      conn.send({ type: 'REQUEST_WORLD', serverSlug } satisfies Message);
    });

    conn.on('data', async (data) => {
      if (data instanceof ArrayBuffer) {
        toast.success('Game world received!', { id: toastId });
        try {
          await onImport(data);
          onOpenChange(false);
        } catch {
          toast.error('Failed to import game world.');
        } finally {
          setIsImporting(false);
        }
      }
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
            filteredAvailableWorlds.map(({ peerId, worlds }) => (
              <div
                key={peerId}
                className="flex flex-col gap-2 border rounded-md p-3"
              >
                <Text
                  variant="muted"
                  className="text-xs"
                >
                  Device: {peerId}
                </Text>
                <div className="flex flex-col gap-2">
                  {worlds.map((world) => (
                    <div
                      key={world.slug}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex flex-col">
                        <Text className="font-medium">{world.name}</Text>
                        <Text
                          variant="muted"
                          className="text-xs"
                        >
                          {world.slug}
                        </Text>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleImport(peerId, world.slug)}
                        disabled={isImporting}
                      >
                        {t('Import')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
