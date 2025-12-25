import { isPlayerVillage } from 'app/(game)/(village-slug)/(map)/guards/village-guard';
import { villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { ApiHandler } from 'app/interfaces/api';
import type { Village } from 'app/interfaces/models/game/village';

export const getVillages: ApiHandler<Village[]> = async (queryClient) => {
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  return villages;
};

export const getVillagesBySlug: ApiHandler<Village, 'villageSlug'> = async (
  queryClient,
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
