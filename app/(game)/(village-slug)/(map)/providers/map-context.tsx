import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import type React from 'react';
import { createContext, useState } from 'react';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

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
  const { mapSize } = useServer();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const tileBaseSize = isWiderThanLg ? 20 : 15;

  const [magnification, setMagnification] = useState<number>(4);
  const tileSize = tileBaseSize * magnification;
  const gridSize = Math.ceil(mapSize * Math.sqrt(2)) + 5;

  const increaseMagnification = () => {
    if (magnification === MAX_MAGNIFICATION) {
      return;
    }

    setMagnification((prevState) => prevState + 1);
  };

  const decreaseMagnification = () => {
    if (magnification === MIN_MAGNIFICATION) {
      return;
    }

    setMagnification((prevState) => prevState - 1);
  };

  const value = {
    magnification,
    increaseMagnification,
    decreaseMagnification,
    tileSize,
    gridSize,
  };

  return <MapContext value={value}>{children}</MapContext>;
};
