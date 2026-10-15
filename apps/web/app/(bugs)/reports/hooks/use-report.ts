import { useQuery } from '@tanstack/react-query';
import { getReport } from '../../api';

export const reportCacheKey = (id: string) => ['report', id] as const;

export const useReport = (token: string, id: string) => {
  return useQuery({
    queryKey: reportCacheKey(id),
    queryFn: ({ signal }) => getReport(token, id, signal),
  });
};
