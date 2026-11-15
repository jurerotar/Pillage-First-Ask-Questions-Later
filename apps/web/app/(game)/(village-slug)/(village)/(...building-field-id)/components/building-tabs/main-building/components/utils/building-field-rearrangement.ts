import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';

export type RearrangeBuildingField = {
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'] | null;
  sourceBuildingFieldId: BuildingField['id'] | null;
};

export const villageViewBuildingFieldIds = Array.from(
  { length: 22 },
  (_, index) => index + 19,
);

const swappableBuildingFieldIds = new Set<BuildingField['id']>(
  villageViewBuildingFieldIds.slice(0, 20),
);

export const isSwappableBuildingField = (
  buildingFieldId: BuildingField['id'],
) => {
  return swappableBuildingFieldIds.has(buildingFieldId);
};
