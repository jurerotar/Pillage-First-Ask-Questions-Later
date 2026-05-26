import { serverDbSchema } from '@pillage-first/types/models/server';
import { selectServerQuery } from '../queries/server-queries';
import { createController } from '../utils/controller';

export const getServer = createController('/server')(({ database }) => {
  return database.selectObject({
    sql: selectServerQuery,
    schema: serverDbSchema,
  })!;
});
