import { snakeCase } from 'moderndash';
import { mapPreferences } from '../mappers/preferences-mapper';
import {
  createUpdatePreferenceQuery,
  selectPreferencesQuery,
} from '../queries/preferences-queries';
import { getPreferencesSchema } from '../schemas/preferences-schemas';
import { createController } from '../utils/controller';

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
