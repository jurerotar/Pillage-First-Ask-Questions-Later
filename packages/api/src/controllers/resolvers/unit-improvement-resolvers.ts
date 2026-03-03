import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';

export const unitImprovementResolver: Resolver<GameEvent<'unitImprovement'>> = (
  database,
  args,
) => {
  const { unitId } = args;

  database.exec({
    sql: `
      UPDATE unit_improvements
      SET
        level = level + 1
      WHERE
        unit_id = (
          SELECT id
          FROM unit_ids
          WHERE unit = $unit_id
          );
    `,
    bind: {
      $unit_id: unitId,
    },
  });
};
