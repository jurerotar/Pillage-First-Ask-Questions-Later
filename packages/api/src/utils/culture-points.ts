import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  CULTURE_POINTS_CELEBRATION_LIMITS,
  type CulturePointsCelebrationType,
  calculateCulturePointsForBuildingField,
  calculateCulturePointsRequirementForVillageCount,
} from '@pillage-first/game-assets/utils/culture-points';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { DbFacade } from '@pillage-first/utils/facades/database';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const buildingCulturePointsRowSchema = z.strictObject({
  building_id: buildingIdSchema,
  level: z.number(),
});

export const getVillagePlayerId = (
  database: DbFacade,
  villageId: number,
): number => {
  return database.selectValue({
    sql: `
      SELECT player_id
      FROM villages
      WHERE id = $village_id;
    `,
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;
};

export const calculateVillageCulturePointsProduction = (
  database: DbFacade,
  villageId: number,
): number => {
  const rows = database.selectObjects({
    sql: `
      SELECT
        bi.building AS building_id,
        bf.level
      FROM
        building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
      WHERE
        bf.village_id = $village_id
        AND bf.level > 0;
    `,
    bind: { $village_id: villageId },
    schema: buildingCulturePointsRowSchema,
  });

  let total = 0;

  for (const row of rows) {
    total += calculateCulturePointsForBuildingField(row.building_id, row.level);
  }

  return total;
};

export const calculatePlayerCulturePointsProduction = (
  database: DbFacade,
  playerId = PLAYER_ID,
): number => {
  const rows = database.selectObjects({
    sql: `
      SELECT
        bi.building AS building_id,
        bf.level
      FROM
        building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          JOIN villages v ON v.id = bf.village_id
      WHERE
        v.player_id = $player_id
        AND bf.level > 0;
    `,
    bind: { $player_id: playerId },
    schema: buildingCulturePointsRowSchema,
  });

  let total = 0;

  for (const row of rows) {
    total += calculateCulturePointsForBuildingField(row.building_id, row.level);
  }

  return total;
};

export const updatePlayerCulturePointsAt = (
  database: DbFacade,
  timestamp: number,
  playerId = PLAYER_ID,
): void => {
  const production = calculatePlayerCulturePointsProduction(database, playerId);

  database.exec({
    sql: `
      UPDATE players
      SET
        culture_points = culture_points + (
          $production * MAX(0, $timestamp - culture_points_updated_at) / $day
        ),
        culture_points_updated_at = MAX(culture_points_updated_at, $timestamp)
      WHERE
        id = $player_id;
    `,
    bind: {
      $production: production,
      $timestamp: timestamp,
      $day: DAY_IN_MILLISECONDS,
      $player_id: playerId,
    },
  });
};

export const addPlayerCulturePoints = (
  database: DbFacade,
  culturePoints: number,
  timestamp: number,
  playerId = PLAYER_ID,
): void => {
  updatePlayerCulturePointsAt(database, timestamp, playerId);

  database.exec({
    sql: `
      UPDATE players
      SET culture_points = culture_points + $culture_points
      WHERE id = $player_id;
    `,
    bind: {
      $culture_points: culturePoints,
      $player_id: playerId,
    },
  });
};

export const calculateCulturePointsCelebrationReward = (
  database: DbFacade,
  villageId: number,
  celebrationType: CulturePointsCelebrationType,
): number => {
  const playerId = getVillagePlayerId(database, villageId);

  const production =
    celebrationType === 'small'
      ? calculateVillageCulturePointsProduction(database, villageId)
      : calculatePlayerCulturePointsProduction(database, playerId);

  return Math.min(
    production,
    CULTURE_POINTS_CELEBRATION_LIMITS[celebrationType],
  );
};

export const getPlayerCulturePointsRequirementContext = (
  database: DbFacade,
  playerId = PLAYER_ID,
) => {
  const { villageCount, culturePointsRequirementSpeed } = database.selectObject(
    {
      sql: `
      SELECT
        (
          SELECT COUNT(*)
          FROM villages
          WHERE player_id = $player_id
        ) AS villageCount,
        culture_points_requirement_speed AS culturePointsRequirementSpeed
      FROM servers
      LIMIT 1;
    `,
      bind: { $player_id: playerId },
      schema: z.strictObject({
        villageCount: z.number(),
        culturePointsRequirementSpeed: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(5),
        ]),
      }),
    },
  )!;

  return {
    villageCount,
    currentVillageCulturePointsRequirement:
      calculateCulturePointsRequirementForVillageCount(
        villageCount,
        culturePointsRequirementSpeed,
      ),
    nextVillageCulturePointsRequirement:
      calculateCulturePointsRequirementForVillageCount(
        villageCount + 1,
        culturePointsRequirementSpeed,
      ),
  };
};
