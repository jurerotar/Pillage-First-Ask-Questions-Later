import type { OccupiedOasisTile, Tile } from 'app/interfaces/models/game/tile';
import { useVillages } from 'app/(game)/(village-slug)/hooks/use-villages';
import { usePlayers } from 'app/(game)/(village-slug)/hooks/use-players';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { calculatePopulationFromBuildingFields } from 'app/(game)/(village-slug)/utils/building';
import { isOccupiedOasisTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';

export const useTilePlayer = (tile: Tile) => {
  const { getVillageByOasis, getVillageById } = useVillages();
  const { playersMap } = usePlayers();
  const { reputationsMap } = useReputations();

  const { playerId, buildingFields, buildingFieldsPresets } = isOccupiedOasisTile(tile)
    ? getVillageByOasis(tile as OccupiedOasisTile)!
    : getVillageById(tile.id)!;
  const player = playersMap.get(playerId)!;
  const reputation = reputationsMap.get(player.faction)!;
  const population = calculatePopulationFromBuildingFields(buildingFields, buildingFieldsPresets);

  return {
    player,
    reputation,
    population,
  };
};
