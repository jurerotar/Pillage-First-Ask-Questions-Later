import { z } from 'zod';
import {
  ANIMAL_CAGE_ITEM_ID,
  getHunterLodgeCatchableAnimals,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { randomArrayElement } from '@pillage-first/utils/random';
import { insertHeroItemIntoHeroInventoryQuery } from '../../../queries/hero-queries';
import { selectVillageAndFirstOasisTileIdsQuery } from '../../../queries/map-queries';
import {
  assessCaptureAnimalCountByIdQuestCompletion,
  assessCaptureAnimalKindCountQuestCompletion,
} from '../../../utils/quests';
import { insertHuntingPartyReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import type { Resolver } from '../resolver';

export const animalCageProductionResolver: Resolver<
  GameEvent<'animalCageProduction'>
> = (database, args) => {
  const { cageAmount, villageId } = args;

  database.exec({
    sql: insertHeroItemIntoHeroInventoryQuery,
    bind: {
      $village_id: villageId,
      $item_id: ANIMAL_CAGE_ITEM_ID,
      $amount: cageAmount,
    },
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [],
  };
};

export const huntersLodgeHuntResolver: Resolver<
  GameEvent<'huntersLodgeHunt'>
> = (database, args) => {
  const { huntingPartyLevel, resolvesAt, villageId } = args;

  const huntersLodge = database.selectObject({
    sql: selectVillageAndFirstOasisTileIdsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      villageTileId: tileIdSchema,
      playerId: z.number(),
      sourceTileId: tileIdSchema,
    }),
  })!;

  const catchableAnimals = getHunterLodgeCatchableAnimals(huntingPartyLevel);
  const unitId = randomArrayElement(catchableAnimals);

  addTroops(database, [
    {
      unitId,
      amount: 1,
      tileId: huntersLodge.villageTileId,
      sourceTileId: huntersLodge.sourceTileId,
    },
  ]);

  insertHuntingPartyReport(database, {
    villageId,
    timestamp: resolvesAt,
    villageTileId: huntersLodge.villageTileId,
    unitId,
    amount: 1,
  });

  database.exec({
    sql: `
      INSERT INTO hunting_capture_history (player_id, unit_id, amount)
      SELECT $player_id, ui.id, 1
      FROM unit_ids ui
      WHERE ui.unit = $unit_id
      ON CONFLICT (player_id, unit_id) DO UPDATE SET
        amount = hunting_capture_history.amount + EXCLUDED.amount;
    `,
    bind: {
      $player_id: huntersLodge.playerId,
      $unit_id: unitId,
    },
  });

  assessCaptureAnimalCountByIdQuestCompletion(
    database,
    unitId,
    resolvesAt,
    huntersLodge.playerId,
  );
  assessCaptureAnimalKindCountQuestCompletion(
    database,
    resolvesAt,
    huntersLodge.playerId,
  );

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [huntersLodge.villageTileId],
  };
};
