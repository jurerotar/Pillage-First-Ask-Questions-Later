import { useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesCacheKey } from 'app/(game)/constants/query-keys';
import type { Preferences } from 'app/interfaces/models/game/preferences';

export const usePreferences = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery<Preferences>({
    queryKey: [preferencesCacheKey],
  });

  const preferences = data as Preferences;

  const togglePreference = (
    preference: keyof Pick<Preferences, 'isReducedMotionModeEnabled' | 'isAccessibilityModeEnabled' | 'shouldShowBuildingNames'>,
  ) => {
    queryClient.setQueryData<Preferences>([preferencesCacheKey], (prevState) => {
      // This is a very hacky way of getting rid of this annoying prevState being undefined error
      if (!prevState) {
        return;
      }

      return {
        ...prevState,
        [preference]: !prevState[preference],
      };
    });
  };

  return {
    ...preferences,
    togglePreference,
  };
};
