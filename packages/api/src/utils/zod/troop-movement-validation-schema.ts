import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type {
  GameEvent,
  TroopMovementEvent,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  isAttackTroopMovementEvent,
  isFindNewVillageTroopMovementEvent,
  isOasisOccupationTroopMovementEvent,
  isRaidTroopMovementEvent,
  isReinforcementsTroopMovementEvent,
  isRelocationTroopMovementEvent,
  isTroopMovementEvent,
} from '@pillage-first/utils/guards/event';

export const validateTroopMovementLogic = (
  database: DbFacade,
  event: Partial<TroopMovementEvent>,
): string[] => {
  const errors: string[] = [];

  if (!isTroopMovementEvent(event as GameEvent)) {
    return errors;
  }

  const troopMovementEvent = event as TroopMovementEvent;

  const {
    targetCoordinates: { x, y },
  } = troopMovementEvent;

  const tileExists = database.selectValue({
    sql: `
      SELECT
        EXISTS
        (
          SELECT 1
          FROM
            tiles
          WHERE
            x = $x
            AND y = $y
          ) AS tile_exists;
    `,
    bind: { $x: x, $y: y },
    schema: z.coerce.boolean(),
  });

  if (!tileExists) {
    errors.push('Target tile does not exist');
  }

  if (
    isAttackTroopMovementEvent(troopMovementEvent) ||
    isRaidTroopMovementEvent(troopMovementEvent)
  ) {
    const isVillageOrOasis = database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              tiles t
                LEFT JOIN villages v ON v.tile_id = t.id
                LEFT JOIN oasis o ON o.tile_id = t.id
            WHERE
              t.x = $x
              AND t.y = $y
              AND (v.id IS NOT NULL OR o.id IS NOT NULL)
            ) AS is_village_or_oasis;
      `,
      bind: { $x: x, $y: y },
      schema: z.coerce.boolean(),
    });

    if (!isVillageOrOasis) {
      errors.push('Target must be a village or an oasis');
    }
  }

  if (isFindNewVillageTroopMovementEvent(troopMovementEvent)) {
    const { troops } = troopMovementEvent;

    const isUnoccupied = database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              tiles t
                LEFT JOIN villages v ON v.tile_id = t.id
                LEFT JOIN oasis o ON o.tile_id = t.id
            WHERE
              t.x = $x
              AND t.y = $y
              AND v.id IS NULL
              AND o.id IS NULL
            ) AS is_unoccupied;
      `,
      bind: { $x: x, $y: y },
      schema: z.coerce.boolean(),
    });

    if (!isUnoccupied) {
      errors.push('Target tile must be unoccupied');
    }

    const isSettlersAlreadyOnTheWay = database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              events
            WHERE
              type = 'troopMovementFindNewVillage'
              AND JSON_EXTRACT(meta, '$.targetCoordinates.x') = $x
              AND JSON_EXTRACT(meta, '$.targetCoordinates.y') = $y
            ) AS is_already_on_the_way;
      `,
      bind: { $x: x, $y: y },
      schema: z.coerce.boolean(),
    });

    if (isSettlersAlreadyOnTheWay) {
      errors.push('Settlers are already on the way to this tile');
    }

    const settlersAmount =
      troops?.find(({ unitId }) => unitId.includes('SETTLER'))?.amount ?? 0;

    if (settlersAmount !== 3) {
      errors.push('Exactly 3 settlers must be selected');
    }
  }

  if (isOasisOccupationTroopMovementEvent(troopMovementEvent)) {
    const { villageId, troops } = troopMovementEvent;

    const oasisStatus = database.selectObject({
      sql: `
        SELECT
          o.id IS NOT NULL AS is_oasis,
          o.village_id = $village_id AS is_occupied_by_you
        FROM
          tiles t
            LEFT JOIN oasis o ON o.tile_id = t.id
        WHERE
          t.x = $x
          AND t.y = $y;
      `,
      bind: { $x: x, $y: y, $village_id: villageId },
      schema: z.object({
        is_oasis: z.coerce.boolean(),
        is_occupied_by_you: z.coerce.boolean(),
      }),
    });

    if (!oasisStatus?.is_oasis) {
      errors.push('Target must be an oasis');
    }

    if (oasisStatus?.is_occupied_by_you) {
      errors.push('Oasis is already occupied by you');
    }

    const { occupiedOases, occupiedOasisSlots } = database.selectObject({
      sql: `
        SELECT
          (
            SELECT COUNT(*)
            FROM
              oasis
            WHERE
              village_id = $village_id
            ) AS occupiedOases,
          (
            SELECT
              CASE
                WHEN bf.level >= 20 THEN 3
                WHEN bf.level >= 15 THEN 2
                WHEN bf.level >= 10 THEN 1
                ELSE 0
                END
            FROM
              building_fields bf
                JOIN building_ids bi ON bi.id = bf.building_id
            WHERE
              bf.village_id = $village_id
              AND bi.building = 'HEROS_MANSION'
            LIMIT 1
            ) AS occupiedOasisSlots;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.strictObject({
        occupiedOases: z.number(),
        occupiedOasisSlots: z.number().nullable(),
      }),
    })!;

    if (occupiedOases >= (occupiedOasisSlots ?? 0)) {
      errors.push('No free oasis occupation slots available');
    }

    const hasHero = troops?.some(({ unitId }) => unitId === 'HERO');

    if (!hasHero) {
      errors.push('Hero must be present in selected troops');
    }
  }

  if (
    isReinforcementsTroopMovementEvent(troopMovementEvent) ||
    isRelocationTroopMovementEvent(troopMovementEvent)
  ) {
    const { villageId } = troopMovementEvent;

    const targetVillageInfo = database.selectObject({
      sql: `
        SELECT
          v.id AS id,
          v.player_id = $player_id AS is_player_village
        FROM
          tiles t
            JOIN villages v ON v.tile_id = t.id
        WHERE
          t.x = $x
          AND t.y = $y;
      `,
      bind: { $x: x, $y: y, $player_id: PLAYER_ID },
      schema: z.object({
        id: z.number(),
        is_player_village: z.coerce.boolean(),
      }),
    });

    if (!targetVillageInfo) {
      errors.push('Target village does not exist');
    } else {
      if (targetVillageInfo.id === villageId) {
        errors.push('Target village cannot be the current village');
      }

      if (!targetVillageInfo.is_player_village) {
        errors.push('Target village must belong to you');
      }
    }
  }

  return errors;
};
