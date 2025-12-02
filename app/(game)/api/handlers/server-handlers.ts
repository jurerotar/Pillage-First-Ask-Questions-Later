import type { ApiHandler } from 'app/interfaces/api';
import { serverDbSchema } from 'app/interfaces/models/game/server';

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

  return serverDbSchema.parse(serverModel);
};
