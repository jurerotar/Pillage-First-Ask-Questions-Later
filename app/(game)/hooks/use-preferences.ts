import { useQuery } from '@tanstack/react-query';

export const preferencesCacheKey = 'preferences';

export const usePreferences = () => {
  const { data: preferences } = useQuery({
    queryKey: [preferencesCacheKey],
  });

  return {
    preferences,
  };
};
