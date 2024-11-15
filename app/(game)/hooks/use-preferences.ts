import { useQuery } from '@tanstack/react-query';
import { preferencesCacheKey } from 'app/query-keys';

export const usePreferences = () => {
  const { data: preferences } = useQuery({
    queryKey: [preferencesCacheKey],
  });

  return {
    preferences,
  };
};
