import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectVillageBuildingLevelQuery } from '../../../queries/village-queries';

export const requireHuntersLodgeLevel = (
  database: DbFacade,
  villageId: number,
) => {
  const huntersLodgeLevel = database.selectValue({
    sql: selectVillageBuildingLevelQuery,
    bind: {
      $village_id: villageId,
      $building_id: 'HUNTERS_LODGE',
    },
    schema: z.number().nullable(),
  })!;

  if (huntersLodgeLevel === null) {
    throw new Error("Hunter's Lodge does not exist");
  }
  return huntersLodgeLevel;
};
