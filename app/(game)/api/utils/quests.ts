import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import { PLAYER_ID } from 'app/constants/player';
import type { Building } from 'app/interfaces/models/game/building';

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

export const assessBuildingQuestCompletion = (
  database: DbFacade,
  villageId: number,
  buildingId: Building['id'],
  level: number,
  timestamp: number,
): void => {
  const oneOfQuestId = `oneOf-${buildingId}-${level}`;
  const everyQuestId = `every-${buildingId}-${level}`;

  // complete the oneOf quest if any building of that type in the village has level >= required level
  database.exec(
    `
    UPDATE quests
    SET completed_at = $completed_at
    WHERE completed_at IS NULL
      AND quest_id = $oneOfQuestId
      AND village_id = $village_id
      AND EXISTS (
        SELECT 1
        FROM building_fields bf
        WHERE bf.village_id = $village_id
          AND bf.building_id = $building_id
          AND bf.level >= $level
      );
  `,
    {
      $completed_at: timestamp,
      $oneOfQuestId: oneOfQuestId,
      $village_id: villageId,
      $building_id: buildingId,
      $level: level,
    },
  );

  // complete the every quest if all existing buildings of that type in the village have level >= required level
  // (ensures there is at least one such building)
  database.exec(
    `
    UPDATE quests
    SET completed_at = $completed_at
    WHERE completed_at IS NULL
      AND quest_id = $everyQuestId
      AND village_id = $village_id
      AND (
        SELECT COUNT(*) FROM building_fields
        WHERE village_id = $village_id
          AND building_id = $building_id
          AND level >= $level
      ) = (
        SELECT COUNT(*) FROM building_fields
        WHERE village_id = $village_id
          AND building_id = $building_id
      )
      AND (
        SELECT COUNT(*) FROM building_fields
        WHERE village_id = $village_id
          AND building_id = $building_id
      ) > 0;
  `,
    {
      $completed_at: timestamp,
      $everyQuestId: everyQuestId,
      $village_id: villageId,
      $building_id: buildingId,
      $level: level,
    },
  );
};
