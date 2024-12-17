import { useQuery } from '@tanstack/react-query';
import { preferencesCacheKey } from 'app/query-keys';
import type { Preferences } from 'app/interfaces/models/game/preferences';

export const usePreferences = () => {
  const { data } = useQuery<Preferences>({
    queryKey: [preferencesCacheKey],
  });

  const preferences = data!;

  return {
    ...preferences,
  };
};
