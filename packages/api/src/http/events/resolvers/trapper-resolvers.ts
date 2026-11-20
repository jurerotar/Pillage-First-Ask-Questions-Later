import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../resolver';

export const trapperCageProductionResolver: Resolver<
  GameEvent<'trapperCageProduction'>
> = (database, args) => {
  const { villageId } = args;

  database.exec({
    sql: `
      INSERT INTO trapper_cages (village_id, unit_id)
      VALUES ($village_id, NULL);
    `,
    bind: { $village_id: villageId },
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [],
  };
};
