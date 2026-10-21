import { useQuery } from '@tanstack/react-query';
import { getReports } from '../../api';

export const reportsCacheKey = ['reports'] as const;

export const useReports = (token: string) => {
  return useQuery({
    queryKey: reportsCacheKey,
    queryFn: ({ signal }) => getReports(token, signal),
  });
};
