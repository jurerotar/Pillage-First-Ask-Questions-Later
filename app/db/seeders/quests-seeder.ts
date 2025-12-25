import { createUnitTroopCountQuests, globalQuests } from 'app/assets/quests';
import { PLAYER_ID } from 'app/constants/player';
import { newVillageQuestsFactory } from 'app/db/seeders/factories/quest-factory';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { Seeder } from 'app/interfaces/db';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { Village } from 'app/interfaces/models/game/village';

export const questsSeeder: Seeder = (database): void => {
  const playerStartingVillageId = database.selectValue(
    `
      SELECT id
      FROM
        villages
      WHERE
        player_id = $player_id;
    `,
    { $player_id: PLAYER_ID },
  ) as Village['id'];

  const playerTribe = database.selectValue(
    `
      SELECT tribe
      FROM
        players
      WHERE
        id = $player_id;
    `,
    { $player_id: PLAYER_ID },
  ) as PlayableTribe;

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
