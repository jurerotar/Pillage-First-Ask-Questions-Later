import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { units } from '@pillage-first/game-assets/units';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

const woundedTroopSeedAmountByCategory = {
  infantry: 100,
  cavalry: 50,
} as const satisfies Record<
  Extract<Unit['category'], 'infantry' | 'cavalry'>,
  number
>;

const isHospitalUnit = (
  unit: Unit,
): unit is Unit & { category: 'infantry' | 'cavalry' } => {
  return unit.category === 'infantry' || unit.category === 'cavalry';
};

export const hospitalSeeder = (database: DbFacade): void => {
  const playerVillages = database.selectObjects({
    sql: `
      SELECT
        v.id AS village_id,
        ti.tribe
      FROM
        villages v
          JOIN players p ON p.id = v.player_id
          JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE
        p.id = $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
      village_id: z.number(),
      tribe: tribeSchema,
    }),
  });

  const woundedTroops = playerVillages.flatMap(({ village_id, tribe }) => {
    return units
      .filter(isHospitalUnit)
      .filter((unit) => {
        return unit.tribe === tribe;
      })
      .map((unit) => ({
        villageId: village_id,
        unitId: unit.id,
        amount: woundedTroopSeedAmountByCategory[unit.category],
      }));
  });

  if (woundedTroops.length === 0) {
    return;
  }

  database.exec({
    sql: `
      INSERT INTO
        wounded_troops (village_id, unit_id, amount, updated_at)
      SELECT
        json_extract(wounded_troop.value, '$.villageId'),
        ui.id,
        json_extract(wounded_troop.value, '$.amount'),
        $updated_at
      FROM
        json_each($wounded_troops) AS wounded_troop
          JOIN unit_ids ui ON ui.unit = json_extract(wounded_troop.value, '$.unitId')
      ON CONFLICT(village_id, unit_id) DO NOTHING;
    `,
    bind: {
      $updated_at: Date.now(),
      $wounded_troops: JSON.stringify(woundedTroops),
    },
  });
};
