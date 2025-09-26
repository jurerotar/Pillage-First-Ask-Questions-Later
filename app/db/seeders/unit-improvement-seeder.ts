import type { Seeder } from 'app/interfaces/db';
import type { UnitTier } from 'app/interfaces/models/game/unit';
import { getUnitsByTribe } from 'app/(game)/(village-slug)/utils/units';
import { batchInsert } from 'app/db/utils/batch-insert';
import { PLAYER_ID } from 'app/constants/player';

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

export const unitImprovementSeeder: Seeder = (database, server): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);

  const upgradableUnits = unitsByTribe.filter(({ tier }) => {
    return upgradableTiers.includes(tier);
  });

  const rows = upgradableUnits.map(({ id: unitId }) => [PLAYER_ID, unitId, 0]);

  batchInsert(
    database,
    'unit_improvements',
    ['player_id', 'unit_id', 'level'],
    rows,
  );
};
