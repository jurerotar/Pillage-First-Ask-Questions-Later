import { z } from 'zod';
import { calculateBuildingCostForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const getBuildingLevelChangeCost = (
  database: DbFacade,
  event: Pick<
    GameEvent<'buildingLevelChange'>,
    'buildingId' | 'level' | 'previousLevel'
  >,
): ResourceBundle => {
  if (event.previousLevel > event.level) {
    return [0, 0, 0, 0];
  }

  const isFreeBuildingConstructionEnabled = database.selectValue({
    sql: 'SELECT is_free_building_construction_enabled FROM developer_settings',
    schema: z.coerce.boolean(),
  });

  if (isFreeBuildingConstructionEnabled) {
    return [0, 0, 0, 0];
  }

  const { buildingId, level } = event;
  return calculateBuildingCostForLevel(buildingId, level);
};
