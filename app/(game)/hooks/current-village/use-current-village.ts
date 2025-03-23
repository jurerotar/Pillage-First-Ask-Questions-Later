import { useVillages } from 'app/(game)/hooks/use-villages';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { calculatePopulationFromBuildingFields } from 'app/(game)/utils/building';
import { useCallback } from 'react';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';

export const _useCurrentVillage = () => {
  const { playerVillages } = useVillages();
  const { villageSlug } = useRouteSegments();

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

  return {
    currentVillage,
    distanceFromCurrentVillage,
    currentVillagePopulation,
  };
};
