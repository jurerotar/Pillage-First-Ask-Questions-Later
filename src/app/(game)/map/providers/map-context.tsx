import React, { useContext, useState, createContext } from 'react';
import { Outlet } from 'react-router-dom';

type MapFilterOption =
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

const MapProvider = () => {
  const [magnification, setMagnification] = useState<number>(2);
  const [mapFilters, setMapFilters] = useState<MapFilters>({
    shouldShowOasisIcons: true
  });

  const increaseMagnification = () => {

  };

  const decreaseMagnification = () => {

  };

  const toggleMapFilter = (name: MapFilterOption) => {
    setMapFilters({
      ...mapFilters,
      [name]: !mapFilters[name]
    });
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
