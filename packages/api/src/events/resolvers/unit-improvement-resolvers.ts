import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';

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
};
