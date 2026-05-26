import { serverDbSchema } from '@pillage-first/types/models/server';
import { createController } from '../http/controller';
import { selectServerQuery } from '../queries/server-queries';

export const getServer = createController('/server')(({ database }) => {
  return database.selectObject({
    sql: selectServerQuery,
    schema: serverDbSchema,
  })!;
});
