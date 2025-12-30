import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitsByTribe } from '@pillage-first/game-assets/units/utils';
import type { Unit } from '@pillage-first/types/models/unit';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';

const upgradableTiers = new Set<Unit['tier']>([
  'tier-1',
  'tier-2',
  'tier-3',
  'scout',
  'tier-4',
  'tier-5',
  'siege-ram',
  'siege-catapult',
]);

export const unitImprovementSeeder: Seeder = (database, server): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);

  const upgradableUnits = unitsByTribe.filter(({ tier }) => {
    return upgradableTiers.has(tier);
  });

  const rows = upgradableUnits.map(({ id: unitId }) => [PLAYER_ID, unitId, 0]);

  batchInsert(
    database,
    'unit_improvements',
    ['player_id', 'unit_id', 'level'],
    rows,
  );
};
