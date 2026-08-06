import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Unit } from '@pillage-first/types/models/unit';
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

const WOUNDED_TROOP_DECAY_RATE_PER_DAY = 0.1;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type WoundedTroopUpdate = {
  villageId: number;
  unitId: Unit['id'];
  amount: number;
};

export const addTroops = (database: DbFacade, troops: Troop[]) => {
  if (troops.length === 1) {
    const troop = troops[0]!;
    database.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        VALUES (
          (SELECT id FROM unit_ids WHERE unit = $unit_id),
          $amount,
          $tile_id,
          $source_tile_id
        )
        ON CONFLICT (unit_id, tile_id, source_tile_id) DO UPDATE SET
          amount = troops.amount + EXCLUDED.amount;
      `,
      bind: {
        $unit_id: troop.unitId,
        $amount: troop.amount,
        $tile_id: troop.tileId,
        $source_tile_id: troop.source,
      },
    });
    return;
  }

  database.exec({
    sql: `
      INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
      SELECT
        unit_ids.id,
        SUM(json_extract(troop.value, '$.amount')),
        json_extract(troop.value, '$.tileId'),
        json_extract(troop.value, '$.source')
      FROM
        json_each($troops) AS troop
        JOIN unit_ids
          ON unit_ids.unit = json_extract(troop.value, '$.unitId')
      WHERE TRUE
      GROUP BY
        unit_ids.id,
        json_extract(troop.value, '$.tileId'),
        json_extract(troop.value, '$.source')
      ON CONFLICT (unit_id, tile_id, source_tile_id) DO UPDATE SET
        amount = troops.amount + EXCLUDED.amount;
    `,
    bind: { $troops: JSON.stringify(troops) },
  });
};

export const removeTroops = (database: DbFacade, troops: Troop[]) => {
  if (troops.length === 1) {
    const troop = troops[0]!;
    const bind = {
      $unit_id: troop.unitId,
      $amount: troop.amount,
      $tile_id: troop.tileId,
      $source_tile_id: troop.source,
    };
    database.exec({
      sql: `
        DELETE FROM troops
        WHERE
          unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
          AND tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND amount <= $amount;
      `,
      bind,
    });
    database.exec({
      sql: `
        UPDATE troops
        SET amount = amount - $amount
        WHERE
          unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
          AND tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND amount > $amount;
      `,
      bind,
    });
    return;
  }

  database.exec({
    sql: `
      WITH requested_troops AS (
        SELECT
          unit_ids.id AS unit_id,
          json_extract(troop.value, '$.tileId') AS tile_id,
          json_extract(troop.value, '$.source') AS source_tile_id,
          SUM(json_extract(troop.value, '$.amount')) AS amount
        FROM
          json_each($troops) AS troop
          JOIN unit_ids
            ON unit_ids.unit = json_extract(troop.value, '$.unitId')
        GROUP BY unit_ids.id, tile_id, source_tile_id
      )
      DELETE FROM troops
      WHERE EXISTS (
        SELECT 1
        FROM requested_troops
        WHERE
          requested_troops.unit_id = troops.unit_id
          AND requested_troops.tile_id = troops.tile_id
          AND requested_troops.source_tile_id = troops.source_tile_id
          AND troops.amount <= requested_troops.amount
      );
    `,
    bind: { $troops: JSON.stringify(troops) },
  });

  database.exec({
    sql: `
      WITH requested_troops AS (
        SELECT
          unit_ids.id AS unit_id,
          json_extract(troop.value, '$.tileId') AS tile_id,
          json_extract(troop.value, '$.source') AS source_tile_id,
          SUM(json_extract(troop.value, '$.amount')) AS amount
        FROM
          json_each($troops) AS troop
          JOIN unit_ids
            ON unit_ids.unit = json_extract(troop.value, '$.unitId')
        GROUP BY unit_ids.id, tile_id, source_tile_id
      )
      UPDATE troops
      SET amount = amount - (
        SELECT requested_troops.amount
        FROM requested_troops
        WHERE
          requested_troops.unit_id = troops.unit_id
          AND requested_troops.tile_id = troops.tile_id
          AND requested_troops.source_tile_id = troops.source_tile_id
      )
      WHERE EXISTS (
        SELECT 1
        FROM requested_troops
        WHERE
          requested_troops.unit_id = troops.unit_id
          AND requested_troops.tile_id = troops.tile_id
          AND requested_troops.source_tile_id = troops.source_tile_id
      );
    `,
    bind: { $troops: JSON.stringify(troops) },
  });
};

export const materializeWoundedTroopsAt = (
  database: DbFacade,
  villageId: number,
  timestamp: number,
) => {
  const woundedTroops = database.selectObjects({
    sql: `
      SELECT
        ui.unit AS unit_id,
        wt.amount,
        wt.updated_at
      FROM
        wounded_troops wt
          JOIN unit_ids ui ON ui.id = wt.unit_id
      WHERE
        wt.village_id = $village_id;
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      unit_id: z.string(),
      amount: z.number(),
      updated_at: z.number(),
    }),
  });

  for (const woundedTroop of woundedTroops) {
    const elapsed = timestamp - woundedTroop.updated_at;

    if (elapsed <= 0) {
      continue;
    }

    const elapsedDays = elapsed / DAY_IN_MILLISECONDS;
    const remainingAmount = Math.floor(
      woundedTroop.amount *
        (1 - WOUNDED_TROOP_DECAY_RATE_PER_DAY) ** elapsedDays,
    );

    if (remainingAmount <= 0) {
      database.exec({
        sql: `
          DELETE FROM wounded_troops
          WHERE
            village_id = $village_id
            AND unit_id = (
              SELECT id
              FROM unit_ids
              WHERE unit = $unit_id
            );
        `,
        bind: {
          $village_id: villageId,
          $unit_id: woundedTroop.unit_id,
        },
      });

      continue;
    }

    if (remainingAmount !== woundedTroop.amount) {
      database.exec({
        sql: `
          UPDATE wounded_troops
          SET
            amount = $amount,
            updated_at = $updated_at
          WHERE
            village_id = $village_id
            AND unit_id = (
              SELECT id
              FROM unit_ids
              WHERE unit = $unit_id
            );
        `,
        bind: {
          $amount: remainingAmount,
          $updated_at: timestamp,
          $village_id: villageId,
          $unit_id: woundedTroop.unit_id,
        },
      });
    }
  }
};

export const selectWoundedTroopAmount = (
  database: DbFacade,
  villageId: number,
  unitId: Unit['id'],
) => {
  return (
    database.selectValue({
      sql: `
        SELECT amount
        FROM wounded_troops
        WHERE
          village_id = $village_id
          AND unit_id = (
            SELECT id
            FROM unit_ids
            WHERE unit = $unit_id
          );
      `,
      bind: {
        $village_id: villageId,
        $unit_id: unitId,
      },
      schema: z.number().nullable(),
    }) ?? 0
  );
};

export const removeWoundedTroops = (
  database: DbFacade,
  woundedTroops: WoundedTroopUpdate[],
) => {
  if (woundedTroops.length === 0) {
    return;
  }

  if (woundedTroops.length === 1) {
    const woundedTroop = woundedTroops[0]!;
    const bind = {
      $village_id: woundedTroop.villageId,
      $unit_id: woundedTroop.unitId,
      $amount: woundedTroop.amount,
    };

    database.exec({
      sql: `
        DELETE FROM wounded_troops
        WHERE
          village_id = $village_id
          AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
          AND amount <= $amount;
      `,
      bind,
    });

    database.exec({
      sql: `
        UPDATE wounded_troops
        SET amount = amount - $amount
        WHERE
          village_id = $village_id
          AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)
          AND amount > $amount;
      `,
      bind,
    });

    return;
  }

  database.exec({
    sql: `
      WITH requested_wounded_troops AS (
        SELECT
          json_extract(wounded_troop.value, '$.villageId') AS village_id,
          unit_ids.id AS unit_id,
          SUM(json_extract(wounded_troop.value, '$.amount')) AS amount
        FROM
          json_each($wounded_troops) AS wounded_troop
          JOIN unit_ids
            ON unit_ids.unit = json_extract(wounded_troop.value, '$.unitId')
        GROUP BY village_id, unit_ids.id
      )
      DELETE FROM wounded_troops
      WHERE EXISTS (
        SELECT 1
        FROM requested_wounded_troops
        WHERE
          requested_wounded_troops.village_id = wounded_troops.village_id
          AND requested_wounded_troops.unit_id = wounded_troops.unit_id
          AND wounded_troops.amount <= requested_wounded_troops.amount
      );
    `,
    bind: { $wounded_troops: JSON.stringify(woundedTroops) },
  });

  database.exec({
    sql: `
      WITH requested_wounded_troops AS (
        SELECT
          json_extract(wounded_troop.value, '$.villageId') AS village_id,
          unit_ids.id AS unit_id,
          SUM(json_extract(wounded_troop.value, '$.amount')) AS amount
        FROM
          json_each($wounded_troops) AS wounded_troop
          JOIN unit_ids
            ON unit_ids.unit = json_extract(wounded_troop.value, '$.unitId')
        GROUP BY village_id, unit_ids.id
      )
      UPDATE wounded_troops
      SET amount = amount - (
        SELECT requested_wounded_troops.amount
        FROM requested_wounded_troops
        WHERE
          requested_wounded_troops.village_id = wounded_troops.village_id
          AND requested_wounded_troops.unit_id = wounded_troops.unit_id
      )
      WHERE EXISTS (
        SELECT 1
        FROM requested_wounded_troops
        WHERE
          requested_wounded_troops.village_id = wounded_troops.village_id
          AND requested_wounded_troops.unit_id = wounded_troops.unit_id
      );
    `,
    bind: { $wounded_troops: JSON.stringify(woundedTroops) },
  });
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
          EXISTS (
            SELECT 1
            FROM
              oasis o
            WHERE
              o.tile_id = t.id
          ) AS is_oasis,
          (
            SELECT MAX(o.village_id)
            FROM
              oasis o
            WHERE
              o.tile_id = t.id
          ) = $village_id AS is_occupied_by_you
        FROM
          tiles t
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
              SELECT COUNT(DISTINCT tile_id)
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
          CASE
            WHEN tt.type = 'free' THEN v.id
            WHEN tt.type = 'oasis' THEN ov.id
          END AS owning_village_id,
          CASE
            WHEN tt.type = 'free' THEN v.player_id
            WHEN tt.type = 'oasis' THEN ov.player_id
          END = $player_id AS is_player_target
        FROM
          tiles t
            JOIN tile_type_ids tt ON tt.id = t.type_id
            JOIN villages cv ON cv.id = $village_id
            LEFT JOIN villages v ON v.tile_id = t.id
            LEFT JOIN villages ov ON ov.id = (
              SELECT MAX(o.village_id)
              FROM
                oasis o
              WHERE
                o.tile_id = t.id
            )
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
