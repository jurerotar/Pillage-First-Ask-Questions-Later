import { useQuery } from '@tanstack/react-query';
import { preferencesCacheKey } from 'app/query-keys';
import type { Preferences } from 'app/interfaces/models/game/preferences';

export const usePreferences = () => {
  const { data } = useQuery<Preferences>({
    queryKey: [preferencesCacheKey],
  });

  const preferences = data!;
  const isDayTheme = preferences.timeOfDay === 'day';
  const isNightTheme = preferences.timeOfDay === 'night';

  return {
    ...preferences,
    isDayTheme,
    isNightTheme,
  };
};
