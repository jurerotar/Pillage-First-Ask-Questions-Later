import type { Building } from '@pillage-first/types/models/building';
import type { NatureUnitId, Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  completeAdventureQuestsQuery,
  completeBattleQuestsQuery,
  completeCaptureAnimalByIdQuestsQuery,
  completeCaptureAnimalKindQuestsQuery,
  completeGatheredResourceQuestsQuery,
  completeQueuedTroopQuestsQuery,
  questCatchableAnimalIds,
} from '../queries/quest-queries';

// Call in the same transaction after crediting enemy casualties to the player.
export const assessBattleQuestCompletion = (
  database: DbFacade,
  timestamp: number,
  playerId: number,
): void => {
  database.exec({
    sql: completeBattleQuestsQuery,
    bind: {
      $completed_at: timestamp,
      $player_id: playerId,
    },
  });
};

export const assessAdventureCountQuestCompletion = (
  database: DbFacade,
  timestamp: number,
  playerId: number,
): void => {
  database.exec({
    sql: completeAdventureQuestsQuery,
    bind: {
      $completed_at: timestamp,
      $player_id: playerId,
    },
  });
};

export const assessQueuedTroopCountQuestCompletion = (
  database: DbFacade,
  unitId: Unit['id'],
  timestamp: number,
  playerId: number,
): void => {
  database.exec({
    sql: completeQueuedTroopQuestsQuery,
    bind: {
      $completed_at: timestamp,
      $unit_id: unitId,
      $player_id: playerId,
    },
  });
};

export const assessCaptureAnimalCountByIdQuestCompletion = (
  database: DbFacade,
  unitId: NatureUnitId,
  timestamp: number,
  playerId: number,
): void => {
  database.exec({
    sql: completeCaptureAnimalByIdQuestsQuery,
    bind: {
      $completed_at: timestamp,
      $unit_id: unitId,
      $quest_pattern: `captureAnimalCountById-${unitId}-[0-9]*`,
      $player_id: playerId,
    },
  });
};

export const assessCaptureAnimalKindCountQuestCompletion = (
  database: DbFacade,
  timestamp: number,
  playerId: number,
): void => {
  database.exec({
    sql: completeCaptureAnimalKindQuestsQuery,
    bind: {
      $completed_at: timestamp,
      $player_id: playerId,
      $unit_ids: questCatchableAnimalIds,
    },
  });
};

export const assessGatheredResourceCountQuestCompletion = (
  database: DbFacade,
  timestamp: number,
  playerId: number,
): void => {
  database.exec({
    sql: `${completeGatheredResourceQuestsQuery} AND q.player_id = $player_id;`,
    bind: {
      $completed_at: timestamp,
      $player_id: playerId,
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
        AND EXISTS (
          SELECT 1
          FROM
            building_fields bf
            CROSS JOIN building_ids bi ON bi.id = bf.building_id
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
          SELECT MIN(bf.level)
          FROM
            building_fields bf
            CROSS JOIN building_ids bi ON bi.id = bf.building_id
          WHERE
            bf.village_id = $village_id
            AND bi.building = $building_id
        ) >= $level;
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
