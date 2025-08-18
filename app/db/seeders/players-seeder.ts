import type { Database } from 'app/interfaces/models/common';
import { batchInsert } from 'app/db/utils/batch-insert';
import {
  generateNpcPlayers,
  playerFactory,
} from 'app/factories/player-factory';
import type { Server } from 'app/interfaces/models/game/server';

const slugifyPlayerName = (name: string): string => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // insert dash before capital following lowercase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
};

export const playersSeeder = (database: Database, server: Server): void => {
  const player = playerFactory(server);
  const npcPlayers = generateNpcPlayers(server);

  const players = [player, ...npcPlayers];

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
