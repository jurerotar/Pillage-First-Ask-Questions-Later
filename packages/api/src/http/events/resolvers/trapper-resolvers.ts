import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../resolver';

export const trapperCageProductionResolver: Resolver<
  GameEvent<'trapperCageProduction'>
> = (database, args) => {
  const { cageAmount, villageId } = args;

  database.exec({
    sql: `
      WITH RECURSIVE cage_counter(i) AS (
        SELECT 1
        UNION ALL
        SELECT i + 1
        FROM cage_counter
        WHERE i < $amount
      )
      INSERT INTO trapper_cages (village_id, unit_id)
      SELECT $village_id, NULL
      FROM cage_counter;
    `,
    bind: {
      $village_id: villageId,
      $amount: cageAmount,
    },
  });

  return {
    affectedVillageIds: [villageId],
  };
};
