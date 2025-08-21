import type { ApiHandler } from 'app/interfaces/api';
import { unitResearchCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';

export const getResearchedUnits: ApiHandler<
  UnitResearch[],
  'villageId'
> = async (queryClient, { params }) => {
  const { villageId } = params;

  const researchedUnits = queryClient.getQueryData<UnitResearch[]>([
    unitResearchCacheKey,
  ])!;

  return researchedUnits.filter((researchedUnits) => {
    return researchedUnits.villageId === villageId;
  });
};
