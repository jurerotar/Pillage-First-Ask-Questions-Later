import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import {
  generateNpcPlayers,
  playerFactory,
} from 'app/db/seeders/factories/player-factory';
import type { FactionName } from 'app/interfaces/models/game/faction';

const slugifyPlayerName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // insert dash before capital following lowercase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
};

export const playersSeeder: Seeder = (database, server): void => {
  const npcFactions = database.selectValues(
    `SELECT id FROM factions WHERE id != 'player';`,
  ) as FactionName[];

  const player = playerFactory(server);
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
