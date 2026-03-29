import { useQuery, useQueryClient } from '@tanstack/react-query';
import Peer from 'peerjs';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { useGameWorldListing } from 'app/(public)/(game-worlds)/hooks/use-game-world-listing';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert.tsx';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Spinner } from 'app/components/ui/spinner';
import { getDeviceId } from 'app/utils/device';

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
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState<boolean>(false);
  const peerRef = useRef<Peer | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const peer = new Peer();
    peerRef.current = peer;

    setIsDiscoveryLoading(true);

    peer.on('open', (id) => {
      const conn = peer.connect(BROADCAST_CHANNEL);

      conn.on('open', () => {
        conn.send({ type: 'QUERY_WORLDS' } satisfies Message);
      });

      conn.on('data', (data) => {
        const message = data as Message;
        if (message.type === 'AVAILABLE_WORLDS_LIST') {
          setIsDiscoveryLoading(false);
          queryClient.setQueryData<{
            list: AvailableWorld[];
            localPeerId: string;
          }>(['available-worlds-discovery'], {
            list: message.list,
            localPeerId: id,
          });
        }
      });

      conn.on('error', (err) => {
        console.error('[ImportModal] Discovery connection error:', err);
        toast.error('Failed to discover devices.');
        setIsDiscoveryLoading(false);
      });
    });

    peer.on('error', (err) => {
      console.error('[ImportModal] Peer error:', err);
      setIsDiscoveryLoading(false);
    });

    return () => {
      peer.destroy();
      peerRef.current = null;
      queryClient.setQueryData(['available-worlds-discovery'], null);
      setIsDiscoveryLoading(false);
    };
  }, [open, queryClient]);

  const { data } = useQuery<{
    list: AvailableWorld[];
    localPeerId: string;
  }>({
    queryKey: ['available-worlds-discovery'],
    queryFn: async () => {
      return null as any;
    },
    enabled: open,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const isLoading = isDiscoveryLoading && !data;

  const availableWorlds = data?.list ?? [];
  const localPeerId = data?.localPeerId ?? null;

  const otherDevices = useMemo(() => {
    const localDeviceId = getDeviceId();
    return availableWorlds.filter(
      (w) => w.peerId !== localPeerId && w.deviceId !== localDeviceId,
    );
  }, [availableWorlds, localPeerId]);

  const filteredAvailableWorlds = useMemo(() => {
    return otherDevices.flatMap((w) => {
      return w.worlds.map((world) => ({ ...world, peerId: w.peerId }));
    });
  }, [otherDevices]);

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

        let buffer: ArrayBuffer | null = null;
        if (data instanceof ArrayBuffer) {
          buffer = data;
        } else if (ArrayBuffer.isView(data)) {
          buffer = data.buffer as ArrayBuffer;
        }

        if (buffer) {
          toast.success('Game world received!', { id: toastId });
          try {
            await onImport(buffer);
            onOpenChange(false);
          } catch (err) {
            console.error(
              '[ImportModal] Failed to import database buffer:',
              err,
            );
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
      console.error('[ImportModal] Connection error:', err);
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

        <div className="flex flex-col gap-2">
          {isLoading && (
            <div className="flex justify-center">
              <Spinner size="large" />
            </div>
          )}

          {!isLoading && otherDevices.length === 0 && (
            <Alert variant="error">
              {t(
                'No devices found. Make sure the app is open on other device.',
              )}
            </Alert>
          )}
          {!isLoading &&
            otherDevices.length > 0 &&
            filteredAvailableWorlds.length === 0 && (
              <Alert variant="info">
                {t(
                  'Other devices found, but no new game worlds are advertised.',
                )}
              </Alert>
            )}

          {!isLoading &&
            filteredAvailableWorlds.map((world) => {
              const isAlreadyImported = gameWorldListing.some(
                (local) => local.id === world.id,
              );

              return (
                <div
                  key={`${world.peerId}-${world.slug}`}
                  className="flex items-center justify-between gap-2 border rounded-md p-2"
                >
                  <div className="flex flex-col gap-1">
                    <Text className="font-medium">{world.name}</Text>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="successive">
                        {world.configuration.speed}x
                      </Badge>
                      <Badge variant="successive">
                        {world.playerConfiguration.tribe}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleImport(world.peerId, world.slug)}
                    disabled={isImporting || isAlreadyImported}
                  >
                    {isAlreadyImported ? t('Imported') : t('Import')}
                  </Button>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
