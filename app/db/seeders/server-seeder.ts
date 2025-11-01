import type { Seeder } from 'app/interfaces/db';

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
    sql: `
      INSERT INTO servers
      (id, version, name, slug, created_at, seed, speed, map_size, player_name, player_tribe)
      VALUES ($id, $version, $name, $slug, $created_at, $seed, $speed, $map_size, $player_name, $player_tribe);
    `,
    bind: {
      $id: id,
      $version: version,
      $name: name,
      $slug: slug,
      $created_at: createdAt,
      $seed: seed,
      $speed: speed,
      $map_size: mapSize,
      $player_name: playerName,
      $player_tribe: tribe,
    },
  });
};
