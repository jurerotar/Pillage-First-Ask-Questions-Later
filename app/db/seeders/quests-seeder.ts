import type { Seeder } from 'app/interfaces/db';
import { PLAYER_ID } from 'app/constants/player';
import type { Village } from 'app/interfaces/models/game/village';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { createUnitTroopCountQuests, globalQuests } from 'app/assets/quests';
import { newVillageQuestsFactory } from 'app/db/factories/quest-factory';
import { batchInsert } from 'app/db/utils/batch-insert';

export const questsSeeder: Seeder = (database): void => {
  const playerStartingVillageId = database.selectValue(
    `
      SELECT id
      FROM villages
      WHERE player_id = $player_id;
    `,
    { $player_id: PLAYER_ID },
  ) as Village['id'];

  const playerTribe = database.selectValue(
    `
      SELECT tribe
      FROM players
      WHERE id = $player_id;
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
};
