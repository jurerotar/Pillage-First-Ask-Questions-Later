import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { createContext, useState, type PropsWithChildren } from 'react';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { calculateGridLayout } from 'app/utils/map';

type MapProviderValues = {
  magnification: number;
  increaseMagnification: () => void;
  decreaseMagnification: () => void;
  tileSize: number;
  gridSize: number;
  MAX_MAGNIFICATION: number;
  MIN_MAGNIFICATION: number;
};

export const MapContext = createContext<MapProviderValues>(
  {} as MapProviderValues,
);

const MAX_MAGNIFICATION = 5;
const MIN_MAGNIFICATION = 2;

export const MapProvider = ({ children }: PropsWithChildren) => {
  const { mapSize } = useServer();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const [magnification, setMagnification] = useState<number>(4);

  const { gridSize } = calculateGridLayout(mapSize);
  const tileBaseSize = isWiderThanLg ? 20 : 15;
  const tileSize = tileBaseSize * magnification;

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
    MAX_MAGNIFICATION,
    MIN_MAGNIFICATION,
  };

  return <MapContext value={value}>{children}</MapContext>;
};
