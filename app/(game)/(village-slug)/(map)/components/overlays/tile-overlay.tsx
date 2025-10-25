import { createContext, type PropsWithChildren } from 'react';
import { useTile } from 'app/(game)/(village-slug)/hooks/use-tile';

type TileOverlayContextState = {
  tile: any;
};

const TileOverlayContext = createContext<TileOverlayContextState>(
  {} as TileOverlayContextState,
);

type TileOverlayProps = {
  tileId: number;
};

export const TileOverlay = ({
  tileId,
  children,
}: PropsWithChildren<TileOverlayProps>) => {
  const { tile } = useTile(tileId);

  return <TileOverlayContext value={{ tile }}>{children}</TileOverlayContext>;
};
