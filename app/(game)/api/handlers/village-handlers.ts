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
