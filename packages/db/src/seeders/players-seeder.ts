import type { Faction } from '@pillage-first/types/models/faction';
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
  const playerFaction = database.selectValue(
    `SELECT id FROM factions WHERE faction = 'player'`,
  ) as Faction;

  const npcFactions = database.selectValues(
    `SELECT id FROM factions WHERE faction != 'player';`,
  ) as Faction[];

  const player = playerFactory(server, playerFaction);
  const npcPlayers = generateNpcPlayers(server, npcFactions);

  const players = [player, ...npcPlayers];

  const playersToInsert = players.map(({ id, name, tribe, faction }) => [
    id,
    name,
    slugifyPlayerName(name),
    tribe,
    faction,
  ]);

  batchInsert(
    database,
    'players',
    ['id', 'name', 'slug', 'tribe', 'faction_id'],
    playersToInsert,
  );
};
