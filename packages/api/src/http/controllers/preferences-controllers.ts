import { snakeCase } from 'moderndash';
import { z } from 'zod';
import {
  preferencesSchema,
  villageSortSchema,
} from '@pillage-first/types/models/preferences';
import {
  createUpdatePreferenceQuery,
  selectPreferencesQuery,
} from '../../queries/preferences-queries';
import { createController } from '../controller';
import { mapPreferences } from './mappers/preferences-mapper';
import { getPreferencesSchema } from './schemas/preferences-schemas';

export const getPreferences = createController('/me/preferences', {
  summary: 'Get player preferences',
  response: preferencesSchema,
})(({ database, context: { playerId } }) => {
  const row = database.selectObject({
    sql: selectPreferencesQuery,
    bind: { $player_id: playerId },
    schema: getPreferencesSchema,
  })!;

  return mapPreferences(row);
});

export const updatePreference = createController(
  '/me/preferences/:preferenceName',
  'patch',
  {
    summary: 'Update player preference',
    requestParams: {
      path: z.strictObject({
        preferenceName: preferencesSchema.keyof(),
      }),
    },
    requestBody: z.strictObject({
      value: z.union([z.boolean(), villageSortSchema]),
    }),
  },
)(
  ({
    database,
    context: { playerId },
    path: { preferenceName },
    body: { value },
  }) => {
    const validatedValue = preferencesSchema.shape[preferenceName].parse(value);
    const column = snakeCase(preferenceName);

    database.exec({
      sql: createUpdatePreferenceQuery(column),
      bind: {
        $player_id: playerId,
        $value: validatedValue,
      },
    });
  },
);
