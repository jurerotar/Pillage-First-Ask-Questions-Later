import { snakeCase } from 'moderndash';
import {
  createUpdatePreferenceQuery,
  selectPreferencesQuery,
} from '../queries/preferences-queries';
import { createController } from '../utils/controller';
import { mapPreferences } from './mappers/preferences-mapper';
import { getPreferencesSchema } from './schemas/preferences-schemas';

export const getPreferences = createController(
  '/players/:playerId/preferences',
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
)(({ database, path: { preferenceName }, body: { value } }) => {
  const column = snakeCase(preferenceName);

  database.exec({
    sql: createUpdatePreferenceQuery(column),
    bind: {
      $value: value,
    },
  });
});
