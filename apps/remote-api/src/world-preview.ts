import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

const worldPreviewSchema = z.object({
  name: z.string(),
  version: z.string(),
  speed: z.int().positive(),
  mapSize: z.int().positive(),
  playerName: z.string(),
  tribe: z.string(),
});

export const readWorldPreview = (path: string) => {
  using database = new DatabaseSync(path, { readOnly: true });

  database.exec('PRAGMA trusted_schema = OFF;');

  const world = database
    .prepare(`
    SELECT name, version, speed, map_size AS mapSize,
      player_name AS playerName, player_tribe AS tribe
    FROM servers LIMIT 1
  `)
    .get();

  return worldPreviewSchema.parse(world);
};
