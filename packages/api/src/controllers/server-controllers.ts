import { serverDbSchema } from '@pillage-first/types/models/server';
import type { Controller } from '../types/controller';

export const getServer: Controller<'/server'> = (database) => {
  return database.selectObject({
    sql: `
      SELECT
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
      FROM
        servers;
    `,
    schema: serverDbSchema,
  })!;
};
