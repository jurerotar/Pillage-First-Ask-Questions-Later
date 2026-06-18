import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Building } from '@pillage-first/types/models/building';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const assessAdventureCountQuestCompletion = (
  database: DbFacade,
  timestamp: number,
): void => {
  database.exec({
    sql: `
      UPDATE quests
      SET
        completed_at = $completed_at
      WHERE
        completed_at IS NULL
        AND quest_id LIKE 'adventureCount-%'
        AND substr(quest_id, length('adventureCount-') + 1) GLOB '[0-9]*'
        AND (
          SELECT COALESCE (
          MAX (
          ha.completed)
          , 0)
          FROM hero_adventures ha
          JOIN heroes h ON ha.hero_id = h.id
          WHERE h.player_id = $player_id
        ) >= CAST (
        substr(
        quest_id
        , LENGTH (
        'adventureCount-') + 1) AS INTEGER);
    `,
    bind: {
      $completed_at: timestamp,
      $player_id: PLAYER_ID,
    },
  });
};

export const assessQueuedTroopCountQuestCompletion = (
  database: DbFacade,
  timestamp: number,
): void => {
  database.exec({
    sql: `
      UPDATE quests
      SET
        completed_at = $completed_at
      WHERE
        completed_at IS NULL
        AND village_id IS NULL
        AND quest_id LIKE 'queuedTroopCount-%'
        AND substr(quest_id, length('queuedTroopCount-') + 1) GLOB '[0-9]*'
        AND (
          (
            SELECT COALESCE(SUM(uth.amount), 0)
            FROM unit_training_history uth
            JOIN villages v ON uth.village_id = v.id
            WHERE v.player_id = $player_id
          )
          +
          (
            SELECT COUNT(*)
            FROM events e
            JOIN villages v ON e.village_id = v.id
            WHERE
              e.type = 'troopTraining'
              AND v.player_id = $player_id
          )
        ) >= CAST (
        substr(
        quest_id
        , LENGTH (
        'queuedTroopCount-') + 1) AS INTEGER);
    `,
    bind: {
      $completed_at: timestamp,
      $player_id: PLAYER_ID,
    },
  });
};

export const assessQueuedTroopCountByIdQuestCompletion = (
  database: DbFacade,
  unitId: Unit['id'],
  timestamp: number,
): void => {
  database.exec({
    sql: `
      UPDATE quests
      SET
        completed_at = $completed_at
      WHERE
        completed_at IS NULL
        AND village_id IS NULL
        AND quest_id LIKE 'queuedTroopCountById-' || $unit_id || '-%'
        AND substr(quest_id, length('queuedTroopCountById-' || $unit_id || '-') + 1) GLOB '[0-9]*'
        AND (
          (
            SELECT COALESCE(SUM(uth.amount), 0)
            FROM unit_training_history uth
            JOIN unit_ids ui ON uth.unit_id = ui.id
            JOIN villages v ON uth.village_id = v.id
            WHERE
              v.player_id = $player_id
              AND ui.unit = $unit_id
          )
          +
          (
            SELECT COUNT(*)
            FROM events e
            JOIN villages v ON e.village_id = v.id
            WHERE
              e.type = 'troopTraining'
              AND v.player_id = $player_id
              AND JSON_EXTRACT(e.meta, '$.unitId') = $unit_id
          )
        ) >= CAST (
        substr(
        quest_id
        , length('queuedTroopCountById-' || $unit_id || '-') + 1) AS INTEGER);
    `,
    bind: {
      $completed_at: timestamp,
      $unit_id: unitId,
      $player_id: PLAYER_ID,
    },
  });
};

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
  database.exec({
    sql: `
      UPDATE quests
      SET
        completed_at = $completed_at
      WHERE
        completed_at IS NULL
        AND quest_id = $quest_id
        AND village_id = $village_id
        AND EXISTS
        (
          SELECT 1
          FROM
            building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          WHERE
            bf.village_id = $village_id
            AND bi.building = $building_id
            AND bf.level >= $level
          );
    `,
    bind: {
      $completed_at: timestamp,
      $quest_id: oneOfQuestId,
      $village_id: villageId,
      $building_id: buildingId,
      $level: level,
    },
  });

  // complete the every quest if all existing buildings of that type in the village have level >= required level
  // (ensures there is at least one such building)
  database.exec({
    sql: `
      UPDATE quests
      SET
        completed_at = $completed_at
      WHERE
        completed_at IS NULL
        AND quest_id = $everyQuestId
        AND village_id = $village_id
        AND (
              SELECT COUNT(*)
              FROM
                building_fields bf
              JOIN building_ids bi ON bi.id = bf.building_id
              WHERE
                bf.village_id = $village_id
                AND bi.building = $building_id
                AND bf.level >= $level
              ) = (
              SELECT COUNT(*)
              FROM
                building_fields bf
              JOIN building_ids bi ON bi.id = bf.building_id
              WHERE
                bf.village_id = $village_id
                AND bi.building = $building_id
              )
        AND (
              SELECT COUNT(*)
              FROM
                building_fields bf
              JOIN building_ids bi ON bi.id = bf.building_id
              WHERE
                bf.village_id = $village_id
                AND bi.building = $building_id
              ) > 0;
    `,
    bind: {
      $completed_at: timestamp,
      $everyQuestId: everyQuestId,
      $village_id: villageId,
      $building_id: buildingId,
      $level: level,
    },
  });
};
