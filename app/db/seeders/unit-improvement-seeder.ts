import type { Database } from 'app/interfaces/models/common';
import type { UnitTier } from 'app/interfaces/models/game/unit';
import type { Server } from 'app/interfaces/models/game/server';
import { getUnitsByTribe } from 'app/(game)/(village-slug)/utils/units';
import { batchInsert } from 'app/db/utils/batch-insert';

const upgradableTiers: UnitTier[] = [
  'tier-1',
  'tier-2',
  'tier-3',
  'scout',
  'tier-4',
  'tier-5',
  'siege-ram',
  'siege-catapult',
];

export const unitImprovementSeeder = (
  database: Database,
  server: Server,
): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);

  const upgradableUnits = unitsByTribe.filter(({ tier }) => {
    return upgradableTiers.includes(tier);
  });

  batchInsert(
    database,
    'unit_improvements',
    ['unit_id', 'level'],
    upgradableUnits,
    ({ id: unitId }) => [unitId, 0],
  );
};
