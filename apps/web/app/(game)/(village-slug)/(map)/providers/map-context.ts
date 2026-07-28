import { createContext } from 'react';

export type MapProviderValues = {
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
