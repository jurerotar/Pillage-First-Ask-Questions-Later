import React, { createContext, FCWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { MapFilterName, MapFilters } from 'interfaces/models/game/preferences/map-filters';
import { useMapFilters } from 'hooks/game/preferences/use-map-filters';
import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';

export type MapProviderValues = {
  magnification: number;
  increaseMagnification: () => void;
  decreaseMagnification: () => void;
  mapFilters: MapFilters;
  toggleMapFilter: (name: MapFilterName) => void;
};

const MapContext = createContext<MapProviderValues>({} as MapProviderValues);

const MAX_MAGNIFICATION = 3;
const MIN_MAGNIFICATION = 1;

const MapProvider: FCWithChildren = ({ children }) => {
  const { serverId } = useCurrentServer();
  const {
    mapFilters,
    mutateMapFilters
  } = useMapFilters();

  const [magnification, setMagnification] = useState<number>(3);

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

  const toggleMapFilter = useCallback((name: MapFilterName) => {
    mutateMapFilters(async () => {
      await database.mapFilters.where({ serverId })
        .modify({
          [name]: !mapFilters[name]
        });
    });
  }, [mapFilters, mutateMapFilters, serverId]);

  const value: MapProviderValues = useMemo(() => ({
    magnification,
    increaseMagnification,
    decreaseMagnification,
    mapFilters,
    toggleMapFilter
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
