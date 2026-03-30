import Peer from 'peerjs';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState<boolean>(false);
  const [discoveryData, setDiscoveryData] = useState<{
    list: AvailableWorld[];
    localPeerId: string;
  } | null>(null);
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
          setDiscoveryData({
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
      setDiscoveryData(null);
      setIsDiscoveryLoading(false);
    };
  }, [open]);

  const isLoading = isDiscoveryLoading && !discoveryData;

  const availableWorlds = discoveryData?.list ?? [];
  const localPeerId = discoveryData?.localPeerId ?? null;

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

    const handleOpen = () => {
      toast.loading('Requesting game world...', { id: toastId });
      conn.send({ type: 'REQUEST_WORLD', serverSlug } satisfies Message);
    };

    const handleData = async (data: unknown) => {
      const buffer =
        data instanceof ArrayBuffer
          ? data
          : ArrayBuffer.isView(data)
            ? data.buffer
            : null;

      if (buffer) {
        toast.success('Game world received!', { id: toastId });
        try {
          await onImport(buffer as ArrayBuffer);
          onOpenChange(false);
        } catch (err) {
          console.error('[ImportModal] Failed to import database buffer:', err);
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
    };

    const handleError = (err: { message: string }) => {
      console.error('[ImportModal] Connection error:', err);
      toast.error('Failed to connect to device', {
        id: toastId,
        description: err.message,
      });
      setIsImporting(false);
    };

    conn.on('open', handleOpen);
    conn.on('data', handleData);
    conn.on('error', handleError);

    const timeoutId = setTimeout(() => {
      if (isImporting) {
        toast.error('Request timed out.', { id: toastId });
        setIsImporting(false);
        conn.close();
      }
    }, 30000); // 30s timeout

    conn.on('close', () => clearTimeout(timeoutId));
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
