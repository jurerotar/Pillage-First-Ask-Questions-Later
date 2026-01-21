import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { calculateGridLayout } from '@pillage-first/utils/map';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';

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

  const value = useMemo(
    () => ({
      magnification,
      increaseMagnification,
      decreaseMagnification,
      tileSize,
      gridSize,
      MAX_MAGNIFICATION,
      MIN_MAGNIFICATION,
    }),
    [
      magnification,
      tileSize,
      gridSize,
      increaseMagnification,
      decreaseMagnification,
    ],
  );

  return <MapContext value={value}>{children}</MapContext>;
};
