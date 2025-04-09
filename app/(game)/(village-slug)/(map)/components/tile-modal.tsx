import { DialogContent, DialogHeader, DialogTitle } from 'app/components/ui/dialog';
import type { Tile } from 'app/interfaces/models/game/tile';
import type React from 'react';

type TileDialogProps = {
  tile: Tile | null;
};

export const TileDialog: React.FC<TileDialogProps> = ({ tile }) => {
  if (!tile) {
    return null;
  }
  return (
    <DialogContent className="">
      <DialogHeader>
        <DialogTitle>Burek</DialogTitle>
      </DialogHeader>
    </DialogContent>
  );
};
