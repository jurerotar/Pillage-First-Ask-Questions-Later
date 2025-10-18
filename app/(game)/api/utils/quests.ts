import { PLAYER_ID } from 'app/constants/player';
import type { DbFacade } from 'app/(game)/api/database-facade';

export const assessAdventureCountQuestCompletion = (
  database: DbFacade,
  timestamp: number,
): void => {
  database.exec(
    `
      UPDATE quests
      SET completed_at = $completed_at
      WHERE completed_at IS NULL
        AND quest_id LIKE 'adventureCount-%'
        AND substr(quest_id, length('adventureCount-') + 1) GLOB '[0-9]*'
        AND village_id IS NOT NULL
        AND village_id IN (
          SELECT id FROM villages WHERE player_id = $player_id
        )
        AND CAST(substr(quest_id, length('adventureCount-') + 1) AS INTEGER) <= (
        SELECT COALESCE(MAX(ha.completed), 0)
        FROM hero_adventures ha
               JOIN heroes h ON ha.hero_id = h.id
        WHERE h.player_id = $player_id
      );
    `,
    {
      $completed_at: timestamp,
      $player_id: PLAYER_ID,
    },
  );
};

export const assessTroopCountQuestCompletion = (
  _database: DbFacade,
): void => {};

export const assessBuildingQuestCompletion = (_database: DbFacade): void => {};
