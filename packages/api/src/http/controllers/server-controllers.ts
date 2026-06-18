import {
  serverDbSchema,
  serverSchema,
} from '@pillage-first/types/models/server';
import { selectServerQuery } from '../../queries/server-queries';
import { createController } from '../controller';

export const getServer = createController('/server', {
  summary: 'Get server details',
  response: serverSchema,
})(({ database }) => {
  return database.selectObject({
    sql: selectServerQuery,
    schema: serverDbSchema,
  })!;
});
