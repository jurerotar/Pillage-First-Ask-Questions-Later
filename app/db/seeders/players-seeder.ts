import type { Database } from 'app/interfaces/models/common';
import type { Player } from 'app/interfaces/models/game/player';
import { batchInsert } from 'app/db/utils/batch-insert';

const slugifyPlayerName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // insert dash before capital following lowercase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
};

export const playersSeeder = (database: Database, players: Player[]): void => {
  batchInsert(
    database,
    'players',
    ['name', 'slug', 'tribe', 'faction_id'],
    players,
    (player) => [
      player.name,
      slugifyPlayerName(player.name),
      player.tribe,
      player.faction,
    ],
  );
};
