import { z } from 'zod';
import {
  type Faction,
  factionSchema,
} from '@pillage-first/types/models/faction';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';
import { generateNpcPlayers, playerFactory } from './factories/player-factory';

const slugifyPlayerName = (name: string): string => {
  return name
    .replaceAll(/([a-z])([A-Z])/g, '$1-$2') // insert dash before capital following lowercase
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
    .replaceAll(/^-+|-+$/g, ''); // trim leading/trailing dashes
};

export const playersSeeder: Seeder = (database, server): void => {
  const factions = database.selectObjects({
    sql: 'SELECT id, faction FROM factions',
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
    return [id, name, slugifyPlayerName(name), tribe, factionId];
  });

  batchInsert(
    database,
    'players',
    ['id', 'name', 'slug', 'tribe', 'faction_id'],
    playersToInsert,
  );
};
