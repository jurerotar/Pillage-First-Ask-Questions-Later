import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitsByTribe } from '@pillage-first/game-assets/utils/units';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

// Visual fixtures for the rally point and village movement tables.
export const troopMovementsSeeder = (database: DbFacade): void => {
  const villages = database.selectObjects({
    sql: `SELECT v.id, v.tile_id, v.player_id, ti.tribe
      FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      ORDER BY v.id;`,
    schema: z.strictObject({
      id: z.number(),
      tile_id: z.number(),
      player_id: z.number(),
      tribe: tribeSchema,
    }),
  });
  const home = villages.find(({ player_id }) => player_id === PLAYER_ID);
  const destinations = villages.filter(
    ({ player_id }) => player_id !== PLAYER_ID,
  );
  if (!home || destinations.length === 0) {
    return;
  }

  const now = Date.now();
  const types = [
    'troopMovementAttack',
    'troopMovementRaid',
    'troopMovementReinforcements',
    'troopMovementReturn',
  ] as const;
  const rows = Array.from({ length: 200 }, (_, index) => {
    const other = destinations[index % destinations.length];
    const type = types[index % types.length];
    const incoming = Math.floor(index / types.length) % 2 === 0;
    const owner = incoming && type !== 'troopMovementReturn' ? other : home;
    const origin = incoming || type === 'troopMovementReturn' ? other : home;
    const target = origin === home ? other : home;
    const units = getUnitsByTribe(owner.tribe);
    const troops = units
      .slice(0, 1 + (index % units.length))
      .map((unit, unitIndex) => ({
        unitId: unit.id,
        amount: 1 + ((index * 137 + unitIndex * 53) % 10000),
        tileId: origin.tile_id,
        sourceTileId: owner.tile_id,
      }));

    return [
      type,
      now - (index % 12) * 60_000,
      // Keep the fixtures visible for at least an hour, with distinct arrivals.
      3_600_000 + index * 97_000 + (index % 12) * 60_000,
      owner.id,
      JSON.stringify({
        originTileId: origin.tile_id,
        targetTileId: target.tile_id,
        troops,
        ...(type === 'troopMovementReturn' && {
          originalMovementType: 'troopMovementRaid',
          loot: [index * 11, index * 7, index * 3, index],
        }),
      }),
    ];
  });

  batchInsert(
    database,
    'events',
    ['type', 'starts_at', 'duration', 'village_id', 'meta'],
    rows,
  );
};
