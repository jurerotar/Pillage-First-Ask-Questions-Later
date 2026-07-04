import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  isAdventureTroopMovementEvent,
  isAttackTroopMovementEvent,
  isFindNewVillageTroopMovementEvent,
  isOasisOccupationTroopMovementEvent,
  isRaidTroopMovementEvent,
  isReinforcementsTroopMovementEvent,
  isRelocationTroopMovementEvent,
  isReturnTroopMovementEvent,
} from '@pillage-first/utils/guards/event';

export const addTroops = (database: DbFacade, troops: Troop[]) => {
  const stmt = database.prepare({
    sql: `
      INSERT INTO
        troops (unit_id, amount, tile_id, source_tile_id)
      VALUES
        ((
           SELECT id
           FROM
             unit_ids
           WHERE
             unit = $unit_id
           ), $amount, $tile_id, $source_tile_id)
      ON CONFLICT (unit_id, tile_id, source_tile_id) DO UPDATE SET
        amount = troops.amount + EXCLUDED.amount;
    `,
  });

  for (const troop of troops) {
    stmt
      .bind({
        $unit_id: troop.unitId,
        $amount: troop.amount,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      })
      .stepReset();
  }
};

export const removeTroops = (database: DbFacade, troops: Troop[]) => {
  for (const troop of troops) {
    database.exec({
      sql: `
        DELETE
        FROM
          troops
        WHERE
          unit_id = (
            SELECT id
            FROM unit_ids
            WHERE unit = $unit_id
            )
          AND tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND amount <= $amount;
      `,
      bind: {
        $unit_id: troop.unitId,
        $amount: troop.amount,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      },
    });

    database.exec({
      sql: `
        UPDATE troops
        SET
          amount = amount - $amount
        WHERE
          unit_id = (
            SELECT id
            FROM unit_ids
            WHERE unit = $unit_id
            )
          AND tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND amount > $amount;
      `,
      bind: {
        $unit_id: troop.unitId,
        $amount: troop.amount,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      },
    });
  }
};

export const validateTroopMovement = (
  database: DbFacade,
  event: Partial<TroopMovementEvent>,
): string[] => {
  const troopMovementEvent = event as TroopMovementEvent;

  const errors: string[] = [];

  if (isReturnTroopMovementEvent(troopMovementEvent)) {
    return [];
  }

  if (isAdventureTroopMovementEvent(troopMovementEvent)) {
    const hasAvailableAdventure = database.selectValue({
      sql: `
        SELECT
          available >= 1 AS has_available_adventure
        FROM
          hero_adventures
        LIMIT 1;
      `,
      schema: z.coerce.boolean(),
    });

    if (!hasAvailableAdventure) {
      return ['Hero has no available adventures'];
    }
  }

  const { targetTileId } = troopMovementEvent;

  const tileExists = database.selectValue({
    sql: `
      SELECT
        EXISTS
        (
          SELECT 1
          FROM
            tiles
          WHERE
            id = $target_tile_id
        ) AS tile_exists;
    `,
    bind: { $target_tile_id: targetTileId },
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
              t.id = $target_tile_id
              AND (v.id IS NOT NULL OR o.id IS NOT NULL)
            ) AS is_village_or_oasis;
      `,
      bind: { $target_tile_id: targetTileId },
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
              t.id = $target_tile_id
              AND v.id IS NULL
              AND o.id IS NULL
            ) AS is_unoccupied;
      `,
      bind: { $target_tile_id: targetTileId },
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
              AND JSON_EXTRACT(meta, '$.targetTileId') = $target_tile_id
            ) AS is_already_on_the_way;
      `,
      bind: { $target_tile_id: targetTileId },
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
          t.id = $target_tile_id;
      `,
      bind: { $target_tile_id: targetTileId, $village_id: villageId },
      schema: z.strictObject({
        is_oasis: z.coerce.boolean(),
        is_occupied_by_you: z.coerce.boolean(),
      }),
    });

    if (!oasisStatus?.is_oasis) {
      errors.push('Target must be an oasis');
    } else {
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
  }

  if (
    isReinforcementsTroopMovementEvent(troopMovementEvent) ||
    isRelocationTroopMovementEvent(troopMovementEvent)
  ) {
    const { villageId } = troopMovementEvent;

    const targetVillageInfo = database.selectObject({
      sql: `
        SELECT
          t.id AS tile_id,
          tt.type AS tile_type,
          cv.tile_id AS current_village_tile_id,
          COALESCE(v.id, ov.id) AS owning_village_id,
          COALESCE(v.player_id, ov.player_id) = $player_id AS is_player_target
        FROM
          tiles t
            JOIN tile_type_ids tt ON tt.id = t.type_id
            JOIN villages cv ON cv.id = $village_id
            LEFT JOIN villages v ON v.tile_id = t.id
            LEFT JOIN oasis o ON o.tile_id = t.id
            LEFT JOIN villages ov ON ov.id = o.village_id
        WHERE
          t.id = $target_tile_id;
      `,
      bind: {
        $target_tile_id: targetTileId,
        $village_id: villageId,
        $player_id: PLAYER_ID,
      },
      schema: z.strictObject({
        tile_id: z.number(),
        tile_type: z.enum(['free', 'oasis']),
        current_village_tile_id: z.number(),
        owning_village_id: z.number().nullable(),
        is_player_target: z.coerce.boolean().nullable(),
      }),
    });

    if (targetVillageInfo?.owning_village_id === null) {
      errors.push(
        'Reinforcements and relocations can only be sent to your own villages or oases',
      );
    } else if (targetVillageInfo) {
      if (
        targetVillageInfo.tile_id === targetVillageInfo.current_village_tile_id
      ) {
        errors.push('Target tile cannot be the current village');
      }

      if (!targetVillageInfo.is_player_target) {
        errors.push('Target tile must belong to you');
      }

      if (
        isRelocationTroopMovementEvent(troopMovementEvent) &&
        targetVillageInfo.tile_type === 'oasis'
      ) {
        errors.push('Troops can not be relocated to oasis');
      }
    } else {
      errors.push('Target tile does not exist');
    }
  }

  return errors;
};
