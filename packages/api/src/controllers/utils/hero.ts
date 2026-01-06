import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '../../facades/database-facade';

export const addHeroExperience = (
  database: DbFacade,
  experience: number,
): void => {
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
