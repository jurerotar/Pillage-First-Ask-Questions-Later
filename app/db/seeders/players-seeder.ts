import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import {
  generateNpcPlayers,
  playerFactory,
} from 'app/factories/player-factory';

const slugifyPlayerName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // insert dash before capital following lowercase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
};

export const playersSeeder: Seeder = (database, server): void => {
  const player = playerFactory(server);
  const npcPlayers = generateNpcPlayers(server);

  const players = [player, ...npcPlayers];

  const rows = players.map(({ name, tribe, faction }) => [
    name,
    slugifyPlayerName(name),
    tribe,
    faction,
  ]);

  batchInsert(
    database,
    'players',
    ['name', 'slug', 'tribe', 'faction_id'],
    rows,
  );
};
