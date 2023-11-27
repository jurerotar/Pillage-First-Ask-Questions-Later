import React, { useContext, useState, createContext } from 'react';
import { Outlet } from 'react-router-dom';

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

const MapProvider = () => {
  const [magnification, setMagnification] = useState<number>(2);
  const [mapFilters, setMapFilters] = useState<MapFilters>({
    shouldShowFactionReputation: true,
    shouldShowOasisIcons: true,
    shouldShowTroopMovements: true,
    shouldShowWheatFields: true,
    shouldShowTileTooltips: true,
    shouldShowTreasureIcons: true,
  });

  const increaseMagnification = () => {
    if(magnification === MAX_MAGNIFICATION) {
      return;
    }

    setMagnification((prevState) => prevState + 1);
  };

  const decreaseMagnification = () => {
    if(magnification === MIN_MAGNIFICATION) {
      return;
    }

    setMagnification((prevState) => prevState - 1);
  };

  const toggleMapFilter = (name: MapFilterOption) => {
    setMapFilters((prevState) => ({
      ...prevState,
      [name]: !prevState[name]
    }));
  };

  const value: MapProviderValues = {
    magnification,
    increaseMagnification,
    decreaseMagnification,
    mapFilters,
    toggleMapFilter
  };

  return (
    <MapContext.Provider value={value}>
      <Outlet />
    </MapContext.Provider>
  );
};

const useMapOptions = () => useContext<MapProviderValues>(MapContext);

export {
  MapProvider,
  useMapOptions
};
