import React, { createContext, FCWithChildren, useCallback, useContext, useMemo, useState } from 'react';

export type MapProviderValues = {
  magnification: number;
  increaseMagnification: () => void;
  decreaseMagnification: () => void;
};

const MapContext = createContext<MapProviderValues>({} as MapProviderValues);

export const MAX_MAGNIFICATION = 4;
export const MIN_MAGNIFICATION = 2;

const MapProvider: FCWithChildren = ({ children }) => {
  const [magnification, setMagnification] = useState<number>(4);

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

  const value: MapProviderValues = useMemo(
    () => ({
      magnification,
      increaseMagnification,
      decreaseMagnification,
    }),
    [magnification, increaseMagnification, decreaseMagnification]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

const useMapOptions = () => useContext<MapProviderValues>(MapContext);

export { MapProvider, useMapOptions };
