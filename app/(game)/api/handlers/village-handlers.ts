import type { ApiHandler } from 'app/interfaces/api';
import { villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Village } from 'app/interfaces/models/game/village';
import { isPlayerVillage } from 'app/(game)/(village-slug)/(map)/guards/village-guard';

export const getVillages: ApiHandler<Village[]> = async (
  queryClient,
  _database,
) => {
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  return villages;
};

`
{
  "id": 1,
  "tile_id": 42,
  "player_id": 7,
  "coordinates_x": 10,
  "coordinates_y": -15,
  "name": "MyVillage",
  "slug": "myvillage",
  "last_updated_at": 1699988888,
  "wood": 100,
  "clay": 120,
  "iron": 90,
  "wheat": 80,
  "RFC": "4446",
  "building_fields": [
    { "field_id": 1, "building_id": "WOODCUTTER", "level": 5 },
    { "field_id": 2, "building_id": "CLAY_PIT",   "level": 3 },
    { "field_id": 39, "building_id": "RALLY_POINT", "level": 1 }
  ]
}
`;

export const getVillagesBySlug: ApiHandler<Village, 'villageSlug'> = async (
  queryClient,
  _database,
  { params },
) => {
  const { villageSlug } = params;

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  const village = villages.find((village) => {
    if (!isPlayerVillage(village)) {
      return false;
    }

    return village.slug === villageSlug;
  })!;

  return village;
};
