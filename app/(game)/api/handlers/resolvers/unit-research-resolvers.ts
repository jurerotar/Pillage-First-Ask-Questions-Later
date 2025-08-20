import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const unitResearchResolver: Resolver<GameEvent<'unitResearch'>> = async (
  _queryClient,
  database,
  args,
) => {
  const { villageId, unitId } = args;

  database.exec({
    sql: 'INSERT INTO unit_research (village_id, unit_id) VALUES (?, ?);',
    bind: [villageId, unitId],
  });
};
