import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { calculatePopulationFromBuildingFields } from 'app/(game)/(village-slug)/utils/building';
import type { Tile } from 'app/interfaces/models/game/tile';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';
import { calculateDistanceBetweenPoints, roundTo2DecimalPoints } from 'app/utils/common';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';

export const useCurrentVillage = () => {
  const { playerVillages } = usePlayerVillages();
  const { villageSlug } = useRouteSegments();

  const currentVillage = playerVillages.find(({ slug }) => slug === villageSlug)!;

  const getCurrentVillagePopulation = () =>
    calculatePopulationFromBuildingFields(currentVillage.buildingFields, currentVillage.buildingFieldsPresets);

  const getDistanceFromCurrentVillage = (tileId: Tile['id']): number => {
    const villageCoordinates = parseCoordinatesFromTileId(currentVillage!.id);
    const tileCoordinates = parseCoordinatesFromTileId(tileId);
    return roundTo2DecimalPoints(calculateDistanceBetweenPoints(villageCoordinates, tileCoordinates));
  };

  return {
    currentVillage,
    getDistanceFromCurrentVillage,
    getCurrentVillagePopulation,
  };
};
