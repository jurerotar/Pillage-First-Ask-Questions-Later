import type React from 'react';
import { createContext, useCallback } from 'react';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import type { Village } from 'app/interfaces/models/game/village';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';
import { calculatePopulationFromBuildingFields } from 'app/(game)/utils/building';

type CurrentVillageContextReturn = {
  currentVillage: Village;
  distanceFromCurrentVillage: (tileId: Tile['id']) => number;
  currentVillagePopulation: number;
};

export const CurrentVillageContext = createContext<CurrentVillageContextReturn>({} as never);

export const CurrentVillageProvider: React.FCWithChildren = ({ children }) => {
  const { getPlayerVillages } = useVillages();
  const { villageSlug } = useRouteSegments();

  const playerVillages = getPlayerVillages();
  const currentVillage = playerVillages.find(({ slug }) => slug === villageSlug)!;
  const currentVillagePopulation = calculatePopulationFromBuildingFields(
    currentVillage.buildingFields,
    currentVillage.buildingFieldsPresets,
  );

  const distanceFromCurrentVillage = useCallback(
    (tileId: Tile['id']): number => {
      const villageCoordinates = parseCoordinatesFromTileId(currentVillage!.id);
      const tileCoordinates = parseCoordinatesFromTileId(tileId);
      return roundTo2DecimalPoints(calculateDistanceBetweenPoints(villageCoordinates, tileCoordinates));
    },
    [currentVillage],
  );

  const value = {
    currentVillage,
    distanceFromCurrentVillage,
    currentVillagePopulation,
  };

  return <CurrentVillageContext value={value}>{children}</CurrentVillageContext>;
};
