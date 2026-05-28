import { snakeCase } from 'moderndash';
import { z } from 'zod';
import { preferencesSchema } from '@pillage-first/types/models/preferences';
import {
  createUpdatePreferenceQuery,
  selectPreferencesQuery,
} from '../../queries/preferences-queries';
import { createController } from '../controller';
import { mapPreferences } from './mappers/preferences-mapper';
import { getPreferencesSchema } from './schemas/preferences-schemas';

export const getPreferences = createController(
  '/players/:playerId/preferences',
  {
    summary: 'Get player preferences',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: preferencesSchema,
  },
)(({ database }) => {
  const row = database.selectObject({
    sql: selectPreferencesQuery,
    schema: getPreferencesSchema,
  })!;

  return mapPreferences(row);
});

export const updatePreference = createController(
  '/players/:playerId/preferences/:preferenceName',
  'patch',
  {
    summary: 'Update player preference',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
        preferenceName: z.string(),
      }),
    },
    requestBody: z.strictObject({
      value: z.union([z.boolean(), z.enum(['detailed', 'compact'])]),
    }),
  },
)(({ database, path: { preferenceName }, body: { value } }) => {
  const column = snakeCase(preferenceName);

  database.exec({
    sql: createUpdatePreferenceQuery(column),
    bind: {
      $value: value,
    },
  });
});
