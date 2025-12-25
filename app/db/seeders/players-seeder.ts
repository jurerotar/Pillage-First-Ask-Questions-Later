import {
  generateNpcPlayers,
  playerFactory,
} from 'app/db/seeders/factories/player-factory';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { Seeder } from 'app/interfaces/db';
import type { Faction } from 'app/interfaces/models/game/faction';

const slugifyPlayerName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // insert dash before capital following lowercase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
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
