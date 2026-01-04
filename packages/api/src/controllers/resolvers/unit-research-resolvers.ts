import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';

export const unitResearchResolver: Resolver<GameEvent<'unitResearch'>> = (
  database,
  args,
) => {
  const { villageId, unitId } = args;

  database.exec(
    `
      INSERT INTO unit_research (village_id, unit_id)
      VALUES ($village_id, $unit_id);
    `,
    {
      $village_id: villageId,
      $unit_id: unitId,
    },
  );
};
