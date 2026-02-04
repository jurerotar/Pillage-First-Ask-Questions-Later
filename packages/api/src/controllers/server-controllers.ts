import { serverDbSchema } from '@pillage-first/types/models/server';
import { createController } from '../types/controller';

export const getServer = createController('/server')(({ database }) => {
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
});
