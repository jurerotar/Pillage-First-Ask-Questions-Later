import { useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';
import { LuCopy } from 'react-icons/lu';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
import { GameWorldTransferProgress } from 'app/(public)/(game-worlds)/components/transfer-progress';
import { exportGameWorldDatabase } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Input } from 'app/components/ui/input';
import { Label } from 'app/components/ui/label';
import {
  type PendingWorldShare,
  type TransferProgress,
  uploadSharedWorld,
} from 'app/utils/remote-api';

export const ShareGameWorldDialog = ({
  server,
  isOpen,
  onClose,
}: {
  server: Server;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const pending = useRef<PendingWorldShare | null>(null);
  const [progress, setProgress] = useState<TransferProgress | null>(null);

  const {
    mutate: share,
    data: shareUrl,
    error,
    isPending: isUploading,
  } = useMutation<string, Error>({
    mutationFn: async () => {
      setProgress(null);

      pending.current ??= {
        world: new Blob([await exportGameWorldDatabase(server)], {
          type: 'application/vnd.sqlite3',
        }),
        filename: `${server.slug}.sqlite3`,
        nextChunkIndex: 0,
      };

      const worldId = await uploadSharedWorld(pending.current, setProgress);
      const url = new URL('/game-worlds/import', window.location.origin);

      url.searchParams.set('world-id', worldId);

      return url.toString();
    },
    onSuccess: () => {
      pending.current = null;
      toast.success('Game world uploaded. Ready to share!');
    },
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isUploading && onClose()}
    >
      <DialogContent
        closeDisabled={isUploading}
        onInteractOutside={(event) => {
          if (isUploading) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isUploading) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Share game world</DialogTitle>
          <DialogDescription>
            {shareUrl ? (
              <>
                {server.name} is ready to share. Open the link or scan the QR
                code on another device to import it. Anyone with the link can
                import it once. The uploaded copy is deleted after import or 24
                hours.
              </>
            ) : (
              <>
                Upload {server.name} to continue on another device. Close any
                open instance of this world before uploading.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {error.message}
          </p>
        )}
        {isUploading && (
          <GameWorldTransferProgress
            label={
              !progress
                ? 'Preparing game world...'
                : progress.loaded === progress.total
                  ? 'Finalizing upload...'
                  : 'Uploading game world...'
            }
            progress={progress}
          />
        )}
        {shareUrl ? (
          <div className="flex flex-col items-center gap-4">
            <QRCodeSVG
              value={shareUrl}
              size={224}
              marginSize={4}
              title="Scan to import this game world"
              className="max-w-full h-auto"
            />
            <div className="grid w-full min-w-0 gap-2">
              <Label htmlFor={`share-url-${server.id}`}>Download link</Label>
              <div className="relative min-w-0">
                <Input
                  id={`share-url-${server.id}`}
                  className="pr-10"
                  readOnly
                  value={shareUrl}
                  onFocus={(event) => event.target.select()}
                />
                <div className="absolute inset-y-0 right-1 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7!"
                    aria-label="Copy link"
                    title="Copy link"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success('Link copied');
                      } catch {
                        toast.error(
                          'Unable to copy. Select and copy the link above.',
                        );
                      }
                    }}
                  >
                    <LuCopy aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Button
            disabled={isUploading}
            onClick={() => share()}
          >
            {isUploading
              ? 'Uploading game world...'
              : pending.current
                ? 'Retry upload'
                : 'Upload game world'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
