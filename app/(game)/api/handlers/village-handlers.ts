import type { ApiHandler } from 'app/interfaces/api';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

type GetVillageBySlugParams = {
  villageSlug: PlayerVillage['slug'];
};

export const getVillageBySlug: ApiHandler<PlayerVillage, GetVillageBySlugParams> = async (queryClient, args) => {
  const { villageSlug } = args.params;

  const playerVillages = queryClient.getQueryData<PlayerVillage[]>([playerVillagesCacheKey])!;
  const village = playerVillages.find(({ slug }) => slug === villageSlug)!;

  return village;
};
