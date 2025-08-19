import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const unitImprovementResolver: Resolver<
  GameEvent<'unitImprovement'>
> = async (_queryClient, database, args) => {
  const { unitId } = args;

  database.exec(
    'UPDATE unit_improvements SET level = level + 1 WHERE unit_id = ?;',
    {
      bind: [unitId],
    },
  );
};
