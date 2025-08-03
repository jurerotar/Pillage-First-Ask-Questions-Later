import type { Database } from 'app/interfaces/models/common';
import type { Server } from 'app/interfaces/models/game/server';

const sql = `INSERT INTO servers (
  id,
  version,
  name,
  slug,
  created_at,
  seed,
  speed,
  map_size,
  player_name,
  player_tribe
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

export const serverSeeder = (database: Database, server: Server): void => {
  const {
    id,
    seed,
    createdAt,
    slug,
    name,
    version,
    configuration,
    playerConfiguration,
  } = server;
  const { speed, mapSize } = configuration;
  const { name: playerName, tribe } = playerConfiguration;

  database.exec({
    sql,
    bind: [
      id,
      version,
      name,
      slug,
      createdAt,
      seed,
      speed,
      mapSize,
      playerName,
      tribe,
    ],
  });
};
