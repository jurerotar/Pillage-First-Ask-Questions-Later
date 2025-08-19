import type { ApiHandler } from 'app/interfaces/api';
import type { Server, ServerModel } from 'app/interfaces/models/game/server';
import { serverApiResource } from 'app/(game)/api/api-resources/server-api-resource';

export const getServer: ApiHandler<Server> = async (_queryClient, database) => {
  const serverModel = database.selectObject(
    'SELECT * from servers;',
  ) as ServerModel;

  return serverApiResource(serverModel);
};
