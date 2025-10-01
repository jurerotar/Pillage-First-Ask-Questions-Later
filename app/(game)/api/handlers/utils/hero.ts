import type { DbFacade } from 'app/(game)/api/database-facade';
import { PLAYER_ID } from 'app/constants/player';

export const addHeroExperience = (database: DbFacade, experience: number) => {
  database.exec(
    `
    UPDATE heroes
    SET experience = experience + $experience
    WHERE player_id = $player_id;
  `,
    {
      $experience: experience,
      $player_id: PLAYER_ID,
    },
  );
};
