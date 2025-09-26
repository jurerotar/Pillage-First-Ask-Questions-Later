import type { Seeder } from 'app/interfaces/db';
import { PLAYER_ID } from 'app/constants/player';
import type { Village } from 'app/interfaces/models/game/village';

export const questsSeeder: Seeder = (database): void => {
  const _playerStartingVillageId = database.selectValue(
    `
    SELECT id
    FROM villages
    WHERE player_id = $player_id;
  `,
    { $player_id: PLAYER_ID },
  ) as Village['id'];

  // const quests = [];
  // const questRewards = [];
  // const questRequirements = [];
  //
  // batchInsert(
  //   database,
  //   'quests',
  //   [],
  //   quests,
  // );
  //
  // batchInsert(
  //   database,
  //   'quest_rewards',
  //   [],
  //   questRewards,
  // );
  //
  // batchInsert(
  //   database,
  //   'quests_requirements',
  //   [],
  //   questRequirements,
  // );
};
