import type { Village, VillageModel } from 'app/interfaces/models/game/village';
import { buildingFieldApiResource } from 'app/(game)/api/api-resources/building-field-api-resources';

export const villageApiResource = (villageModel: VillageModel): Village => {
  const buildingFields = JSON.parse(villageModel.building_fields);

  return {
    id: villageModel.id,
    tileId: villageModel.tile_id,
    playerId: villageModel.player_id,
    coordinates: {
      x: villageModel.coordinates_x,
      y: villageModel.coordinates_y,
    },
    name: villageModel.name,
    slug: villageModel.slug,
    buildingFields: buildingFields.map(buildingFieldApiResource),
    lastUpdatedAt: 0,
    resourceFieldComposition: villageModel.resource_field_composition,
    resources: {
      wood: villageModel.wood,
      clay: villageModel.clay,
      iron: villageModel.iron,
      wheat: villageModel.wheat,
    },
  };
};
