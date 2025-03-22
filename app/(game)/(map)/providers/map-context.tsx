import { useCurrentServer } from 'app/(game)/hooks/use-current-server';
import type React from 'react';
import { createContext, use, useCallback, useMemo, useState } from 'react';
import { ViewportContext } from 'app/providers/viewport-context';

type MapProviderValues = {
  magnification: number;
  increaseMagnification: () => void;
  decreaseMagnification: () => void;
  tileSize: number;
  gridSize: number;
};

export const MapContext = createContext<MapProviderValues>({} as MapProviderValues);

export const MAX_MAGNIFICATION = 5;
export const MIN_MAGNIFICATION = 3;

export const MapProvider: React.FCWithChildren = ({ children }) => {
  const { mapSize } = useCurrentServer();
  const { isWiderThanLg } = use(ViewportContext);

  const tileBaseSize = isWiderThanLg ? 20 : 15;

  const [magnification, setMagnification] = useState<number>(4);
  const tileSize = tileBaseSize * magnification;
  const gridSize = Math.ceil(mapSize * Math.sqrt(2)) + 5;

  const increaseMagnification = useCallback(() => {
    if (magnification === MAX_MAGNIFICATION) {
      return;
    }

    setMagnification((prevState) => prevState + 1);
  }, [magnification]);

  const decreaseMagnification = useCallback(() => {
    if (magnification === MIN_MAGNIFICATION) {
      return;
    }

    setMagnification((prevState) => prevState - 1);
  }, [magnification]);

  const value = useMemo<MapProviderValues>(
    () => ({
      magnification,
      increaseMagnification,
      decreaseMagnification,
      tileSize,
      gridSize,
    }),
    [magnification, increaseMagnification, decreaseMagnification, tileSize, gridSize],
  );

  return <MapContext value={value}>{children}</MapContext>;
};
