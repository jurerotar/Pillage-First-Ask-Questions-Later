import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitsByTribe } from '@pillage-first/game-assets/units/utils';
import type { Server } from '@pillage-first/types/models/server';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

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

export const unitImprovementSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);

  const upgradableUnitIds = unitsByTribe
    .filter(({ tier }) => upgradableTiers.has(tier))
    .map((u) => u.id);

  database.exec({
    sql: `
      INSERT INTO
        unit_improvements (player_id, unit_id, level)
      SELECT
        $player_id,
        id,
        0
      FROM
        unit_ids
      WHERE
        unit IN (${upgradableUnitIds.map((_, i) => `$unit${i}`).join(',')});
    `,
    bind: {
      $player_id: PLAYER_ID,
      ...Object.fromEntries(
        upgradableUnitIds.map((id, i) => [`$unit${i}`, id]),
      ),
    },
  });
};
