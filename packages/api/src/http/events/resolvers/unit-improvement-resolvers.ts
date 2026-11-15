import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { insertUnitImprovementReport } from '../../../utils/report';
import type { Resolver } from '../resolver';

export const unitImprovementResolver: Resolver<GameEvent<'unitImprovement'>> = (
  database,
  args,
) => {
  const { villageId, unitId, level, resolvesAt } = args;

  database.exec({
    sql: `
      UPDATE unit_improvements
      SET
        level = $level
      WHERE
        player_id = (SELECT player_id FROM villages WHERE id = $village_id)
        AND unit_id = (
          SELECT id
          FROM unit_ids
          WHERE unit = $unit_id
          );
    `,
    bind: {
      $unit_id: unitId,
      $level: level,
      $village_id: villageId,
    },
  });

  const playerVillageIds = database.selectValues({
    sql: 'SELECT id FROM villages WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id);',
    bind: { $village_id: villageId },
    schema: z.number(),
  });

  insertUnitImprovementReport(database, {
    villageId,
    timestamp: resolvesAt,
    unitId,
    level,
  });

  return {
    affectedVillageIds: playerVillageIds,
    affectedTileIds: [],
  };
};
