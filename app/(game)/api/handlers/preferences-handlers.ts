import type { ApiHandler } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';

export const getPreferences: ApiHandler<Preferences> = async (
  _queryClient,
  database,
) => {
  return Object.fromEntries(
    database.selectArrays(`
      SELECT preference_key,
             coalesce(bool_value, text_value) AS value
      FROM preferences;
    `),
  ) satisfies Preferences;
};

type UpdatePreferenceBody = {
  value: Preferences[keyof Preferences];
};

export const updatePreference: ApiHandler<
  void,
  'preferenceName',
  UpdatePreferenceBody
> = async (_queryClient, database, args) => {
  const { body, params } = args;
  const { preferenceName } = params;
  const { value } = body;

  const isBoolean = typeof value === 'boolean';
  const textValue = isBoolean ? null : value;
  const boolValue = isBoolean ? value : null;

  database.exec({
    sql: `
      UPDATE preferences
      SET text_value = $text_value,
          bool_value = $bool_value
      WHERE preference_key = $preference_key;
    `,
    bind: {
      $text_value: textValue,
      $bool_value: boolValue,
      $preference_key: preferenceName,
    },
  });
};
