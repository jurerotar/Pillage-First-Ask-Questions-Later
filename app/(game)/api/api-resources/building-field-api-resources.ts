import type { BuildingFieldModel } from 'app/interfaces/models/game/building-field';
import type { BuildingField } from 'app/interfaces/models/game/building-field';

export const buildingFieldApiResource = (
  buildingFieldModel: Omit<BuildingFieldModel, 'village_id'>,
): BuildingField => {
  return {
    id: buildingFieldModel.field_id,
    buildingId: buildingFieldModel.building_id,
    level: buildingFieldModel.level,
  };
};
