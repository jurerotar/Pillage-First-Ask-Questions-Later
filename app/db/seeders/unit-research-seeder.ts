import type { Database } from 'app/interfaces/models/common';
import { getUnitsByTribe } from 'app/(game)/(village-slug)/utils/units';
import type { Server } from 'app/interfaces/models/game/server';

const sql = `
  INSERT INTO unit_research (village_id, unit_id)
  VALUES (?, ?);
`;

export const unitResearchSeeder = (
  database: Database,
  server: Server,
): void => {
  const unitsByTribe = getUnitsByTribe(server.playerConfiguration.tribe);
  const tier1Unit = unitsByTribe.find(({ tier }) => tier === 'tier-1')!;

  const playerStartingTileId = database.selectValue(
    'SELECT id FROM tiles WHERE x = 0 AND y = 0;',
  )! as number;

  database.exec({
    sql,
    bind: [playerStartingTileId, tier1Unit.id],
  });
};
