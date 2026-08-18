import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../resolver';

export const unitImprovementResolver: Resolver<GameEvent<'unitImprovement'>> = (
  database,
  args,
) => {
  const { unitId, level } = args;

  database.exec({
    sql: `
      UPDATE unit_improvements
      SET
        level = $level
      WHERE
        unit_id = (
          SELECT id
          FROM unit_ids
          WHERE unit = $unit_id
          );
    `,
    bind: {
      $unit_id: unitId,
      $level: level,
    },
  });

  const playerVillageIds = database.selectValues({
    sql: 'SELECT id FROM villages WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return {
    affectedVillageIds: playerVillageIds,
    affectedTileIds: [],
  };
};
