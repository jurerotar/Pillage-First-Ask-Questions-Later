import { z } from 'zod';
import {
  ANIMAL_CAGE_ITEM_ID,
  getHunterLodgeCatchableAnimals,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { randomArrayElement } from '@pillage-first/utils/random';
import { insertAnimalCagesIntoHeroInventoryQuery } from '../../../queries/hero-queries';
import { selectVillageAndFirstOasisTileIdsQuery } from '../../../queries/map-queries';
import { addTroops } from '../../../utils/troops';
import type { Resolver } from '../resolver';

export const animalCageProductionResolver: Resolver<
  GameEvent<'animalCageProduction'>
> = (database, args) => {
  const { cageAmount, villageId } = args;

  database.exec({
    sql: insertAnimalCagesIntoHeroInventoryQuery,
    bind: {
      $village_id: villageId,
      $item_id: ANIMAL_CAGE_ITEM_ID,
      $amount: cageAmount,
    },
  });
};

export const huntersLodgeHuntResolver: Resolver<
  GameEvent<'huntersLodgeHunt'>
> = (database, args) => {
  const { huntingPartyLevel, villageId } = args;

  const huntersLodge = database.selectObject({
    sql: selectVillageAndFirstOasisTileIdsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      villageTileId: z.number(),
      sourceTileId: z.number(),
    }),
  })!;

  const catchableAnimals = getHunterLodgeCatchableAnimals(huntingPartyLevel);
  const unitId = randomArrayElement(catchableAnimals);

  addTroops(database, [
    {
      unitId,
      amount: 1,
      tileId: huntersLodge.villageTileId,
      source: huntersLodge.sourceTileId,
    },
  ]);
};
