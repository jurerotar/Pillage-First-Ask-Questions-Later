import { z } from 'zod';
import {
  type Faction,
  factionSchema,
} from '@pillage-first/types/models/faction';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';
import { generateNpcPlayers, playerFactory } from './factories/player-factory';

const slugifyPlayerName = (name: string): string => {
  return name
    .replaceAll(/([a-z])([A-Z])/g, '$1-$2') // insert dash before capital following lowercase
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
    .replaceAll(/^-+|-+$/g, ''); // trim leading/trailing dashes
};

export const playersSeeder = (database: DbFacade, server: Server): void => {
  const tribeIds = database.selectObjects({
    sql: 'SELECT id, tribe FROM tribe_ids',
    schema: z.strictObject({
      id: z.number(),
      tribe: z.string(),
    }),
  });

  const tribeMap = new Map<string, number>(
    tribeIds.map((t) => [t.tribe, t.id]),
  );

  const factions = database.selectObjects({
    sql: 'SELECT id, faction FROM faction_ids',
    schema: z.strictObject({
      id: z.number(),
      faction: factionSchema,
    }),
  });

  const factionMap = new Map<Faction, number>(
    factions.map((f) => [f.faction, f.id]),
  );

  const playerFaction = factionMap.get('player')!;
  // We only have 1 "real" player, so we can delete this faction
  factionMap.delete('player');

  const npcFactionIds = [...factionMap.values()];

  const player = playerFactory(server, playerFaction);
  const npcPlayers = generateNpcPlayers(server, npcFactionIds);

  const players = [player, ...npcPlayers];

  const playersToInsert = players.map(({ id, name, tribe, factionId }) => {
    return [id, name, slugifyPlayerName(name), tribeMap.get(tribe)!, factionId];
  });

  batchInsert(
    database,
    'players',
    ['id', 'name', 'slug', 'tribe_id', 'faction_id'],
    playersToInsert,
  );
};
