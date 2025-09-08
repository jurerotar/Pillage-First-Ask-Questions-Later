import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';

const getServerResponseSchema = z
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
  })
  .transform(
    (t) => {
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
        },
      };
    },
  );

export const getServer: ApiHandler<z.infer<typeof getServerResponseSchema>> = async (
  _queryClient,
  database,
) => {
  const serverModel = database.selectObject('SELECT * from servers;');

  return getServerResponseSchema.parse(serverModel);
};
