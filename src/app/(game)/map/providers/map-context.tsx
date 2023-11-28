import React, { useContext, useState, createContext, useMemo, useCallback, FCWithChildren } from 'react';

type MapFilterOption =
  | 'shouldShowFactionReputation'
  | 'shouldShowTroopMovements'
  | 'shouldShowWheatFields'
  | 'shouldShowTileTooltips'
  | 'shouldShowTreasureIcons'
  | 'shouldShowOasisIcons';

type MapFilters = Record<MapFilterOption, boolean>;

export type MapProviderValues = {
  magnification: number;
  increaseMagnification: () => void;
  decreaseMagnification: () => void;
  mapFilters: MapFilters;
  toggleMapFilter: (name: MapFilterOption) => void;
};

const MapContext = createContext<MapProviderValues>({} as MapProviderValues);

const MAX_MAGNIFICATION = 3;
const MIN_MAGNIFICATION = 1;

const MapProvider: FCWithChildren = ({ children }) => {
  const [magnification, setMagnification] = useState<number>(2);
  const [mapFilters, setMapFilters] = useState<MapFilters>({
    shouldShowFactionReputation: true,
    shouldShowOasisIcons: true,
    shouldShowTroopMovements: true,
    shouldShowWheatFields: true,
    shouldShowTileTooltips: true,
    shouldShowTreasureIcons: true,
  });

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

  const toggleMapFilter = useCallback((name: MapFilterOption) => {
    setMapFilters((prevState) => ({
      ...prevState,
      [name]: !prevState[name],
    }));
  }, []);

  const value: MapProviderValues = useMemo(() => ({
    magnification,
    increaseMagnification,
    decreaseMagnification,
    mapFilters,
    toggleMapFilter,
  }), [magnification, mapFilters, increaseMagnification, decreaseMagnification, toggleMapFilter]);

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

const useMapOptions = () => useContext<MapProviderValues>(MapContext);

export {
  MapProvider,
  useMapOptions
};
