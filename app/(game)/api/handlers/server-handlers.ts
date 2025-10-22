import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import { tribeSchema } from 'app/interfaces/models/game/tribe';

const getServerSchema = z
  .strictObject({
    id: z.string(),
    version: z.string(),
    name: z.string(),
    slug: z.string(),
    created_at: z.number(),
    seed: z.string(),
    map_size: z.number(),
    speed: z.number(),
    player_name: z.string(),
    player_tribe: tribeSchema,
  })
  .transform((t) => {
    return {
      id: t.id,
      version: t.version,
      name: t.name,
      slug: t.slug,
      createdAt: t.created_at,
      seed: t.seed,
      configuration: {
        mapSize: t.map_size,
        speed: t.speed,
      },
      playerConfiguration: {
        name: t.player_name,
        tribe: t.player_tribe,
      },
    };
  });

export const getServer: ApiHandler = (database) => {
  const serverModel = database.selectObject(`
    SELECT id,
           version,
           name,
           slug,
           created_at,
           seed,
           speed,
           map_size,
           player_name,
           player_tribe
    FROM servers;
  `);

  return getServerSchema.parse(serverModel);
};
