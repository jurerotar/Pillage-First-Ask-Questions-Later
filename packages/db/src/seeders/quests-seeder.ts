import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  createUnitTroopCountQuests,
  globalQuests,
} from '@pillage-first/game-assets/quests';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';
import { newVillageQuestsFactory } from './factories/quest-factory';

export const questsSeeder = (database: DbFacade): void => {
  const playerStartingVillageId = database.selectValue({
    sql: `
      SELECT id
      FROM
        villages
      WHERE
        player_id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  const playerTribe = database.selectValue({
    sql: `
      SELECT ti.tribe
      FROM
        players p
        JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE
        p.id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: playableTribeSchema,
  })!;

  const questsToSeed = [];

  const villageQuests = newVillageQuestsFactory(
    playerStartingVillageId,
    playerTribe,
  );

  const tribeUnitTroopCountQuests = createUnitTroopCountQuests(playerTribe);

  for (const { id } of villageQuests) {
    questsToSeed.push([id, null, null, playerStartingVillageId]);
  }

  const seedableGlobalQuests = [...globalQuests, ...tribeUnitTroopCountQuests];

  for (const { id } of seedableGlobalQuests) {
    questsToSeed.push([id, null, null, null]);
  }

  batchInsert(
    database,
    'quests',
    ['quest_id', 'completed_at', 'collected_at', 'village_id'],
    questsToSeed,
  );

  database.exec({
    sql: `
        UPDATE quests
        SET
          completed_at = $completed_at
        WHERE
          quest_id = $quest_id
          AND village_id = $village_id;
      `,
    bind: {
      $quest_id: 'oneOf-MAIN_BUILDING-1',
      $village_id: playerStartingVillageId,
      $completed_at: Date.now(),
    },
  });
};
