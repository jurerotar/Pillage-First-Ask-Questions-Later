import type { ApiHandler } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { preferencesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const getPreferences: ApiHandler<Preferences> = async (queryClient) => {
  return queryClient.getQueryData<Preferences>([preferencesCacheKey])!;
};

type UpdatePreferenceBody = {
  value: Preferences[keyof Preferences];
};

export const updatePreference: ApiHandler<
  void,
  'preferenceName',
  UpdatePreferenceBody
> = async (queryClient, args) => {
  const { body, params } = args;

  const { preferenceName } = params;
  const { value } = body;

  queryClient.setQueryData<Preferences>(
    [preferencesCacheKey],
    (prevPreferences) => {
      return {
        ...prevPreferences!,
        [preferenceName]: value,
      };
    },
  );
};
