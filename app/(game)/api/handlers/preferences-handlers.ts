import type { ApiHandler } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { preferencesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const getPreferences: ApiHandler<Preferences> = async (queryClient) => {
  return queryClient.getQueryData<Preferences>([preferencesCacheKey])!;
};

type UpdatePreferenceBody = Partial<
  Record<keyof Pick<Preferences, 'isReducedMotionModeEnabled' | 'isAccessibilityModeEnabled' | 'shouldShowBuildingNames'>, boolean>
>;

export const updatePreference: ApiHandler<Preferences, void, UpdatePreferenceBody> = async (queryClient, args) => {
  const { body } = args;

  queryClient.setQueryData<Preferences>([preferencesCacheKey], (prevPreferences) => {
    return {
      ...prevPreferences!,
      ...body,
    };
  });

  const preferences = queryClient.getQueryData<Preferences>([preferencesCacheKey])!;

  return preferences;
};
