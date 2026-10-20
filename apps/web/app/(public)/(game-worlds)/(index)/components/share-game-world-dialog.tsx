import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Server } from '@pillage-first/types/models/server';
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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [shareUrl, setShareUrl] = useState<string>();
  const pending = useRef<PendingWorldShare | null>(null);
  const inProgress = useRef(false);

  const share = async () => {
    if (inProgress.current) {
      return;
    }
    inProgress.current = true;
    setIsUploading(true);
    setError(undefined);
    try {
      pending.current ??= {
        world: new Blob([await exportGameWorldDatabase(server)], {
          type: 'application/vnd.sqlite3',
        }),
        filename: `${server.slug}.sqlite3`,
        nextChunkIndex: 0,
      };
      const worldId = await uploadSharedWorld(pending.current);
      const url = new URL('/game-worlds/import', window.location.origin);
      url.searchParams.set('world-id', worldId);
      setShareUrl(url.toString());
      pending.current = null;
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to share game world.',
      );
    } finally {
      inProgress.current = false;
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !inProgress.current && onClose()}
    >
      <DialogContent
        closeDisabled={isUploading}
        onInteractOutside={(event) => {
          if (inProgress.current) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (inProgress.current) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Share game world</DialogTitle>
          <DialogDescription>
            Upload {server.name} to continue on another device. Close any open
            instance of this world before uploading. Anyone with the link can
            import it once. The uploaded copy is deleted after a successful
            import.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
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
            <div className="w-full grid gap-2">
              <Label htmlFor={`share-url-${server.id}`}>Download link</Label>
              <Input
                id={`share-url-${server.id}`}
                readOnly
                value={shareUrl}
                onFocus={(event) => event.target.select()}
              />
              <Button
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
                Copy link
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShareUrl(undefined);
                  void share();
                }}
              >
                Upload a new copy
              </Button>
            </div>
          </div>
        ) : (
          <Button
            disabled={isUploading}
            onClick={() => void share()}
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
