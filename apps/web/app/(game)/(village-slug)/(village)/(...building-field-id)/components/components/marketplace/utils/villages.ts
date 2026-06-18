import type { Village } from '@pillage-first/types/models/village';

export type VillageOption = Pick<
  Village,
  'id' | 'tileId' | 'coordinates' | 'name'
>;

export const getMarketplaceLevel = (
  village: Pick<Village, 'buildingFields'>,
) => {
  return (
    village.buildingFields.find(
      (buildingField) => buildingField.buildingId === 'MARKETPLACE',
    )?.level ?? 0
  );
};
