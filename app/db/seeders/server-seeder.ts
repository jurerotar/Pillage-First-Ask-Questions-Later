import type { Seeder } from 'app/interfaces/db';

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

export const serverSeeder: Seeder = (database, server): void => {
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
