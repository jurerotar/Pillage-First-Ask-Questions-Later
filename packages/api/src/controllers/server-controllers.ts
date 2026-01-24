import { serverDbSchema } from '@pillage-first/types/models/server';
import type { Controller } from '../types/controller';

/**
 * GET /server
 */
export const getServer: Controller<'/server'> = (database) => {
  const serverModel = database.selectObject({
    sql: `
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
  `,
  });

  return serverDbSchema.parse(serverModel);
};
