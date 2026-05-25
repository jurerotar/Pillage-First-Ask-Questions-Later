import { z } from 'zod';
import { unitsMap } from '@pillage-first/game-assets/units';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

type SurvivingTroop = { unitId: UnitId; amount: number };

export const sumCarryCapacity = (troops: SurvivingTroop[]): number => {
  let total = 0;
  for (const { unitId, amount } of troops) {
    const unit = unitsMap.get(unitId);
    if (!unit) {
      continue;
    }
    total += unit.unitCarryCapacity * amount;
  }
  return total;
};

export const getCrannyCapacity = (
  database: DbFacade,
  villageId: number,
): number => {
  return (
    database.selectValue({
      sql: `
        SELECT
          COALESCE(SUM(e.value), 0)
        FROM
          effects e
            JOIN effect_ids ei ON ei.id = e.effect_id
        WHERE
          ei.effect = 'crannyCapacity'
          AND e.village_id = $village_id;
      `,
      bind: { $village_id: villageId },
      schema: z.number(),
    }) ?? 0
  );
};

export const calculateLoot = (
  currentResources: [number, number, number, number],
  crannyCapacity: number,
  carryCapacity: number,
): [number, number, number, number] => {
  const lootable = currentResources.map((r) =>
    Math.max(0, r - crannyCapacity),
  ) as [number, number, number, number];

  const totalLootable = lootable.reduce((sum, r) => sum + r, 0);

  if (totalLootable === 0 || carryCapacity === 0) {
    return [0, 0, 0, 0];
  }

  const proportion = Math.min(1, carryCapacity / totalLootable);
  return lootable.map((r) => Math.floor(r * proportion)) as [
    number,
    number,
    number,
    number,
  ];
};
