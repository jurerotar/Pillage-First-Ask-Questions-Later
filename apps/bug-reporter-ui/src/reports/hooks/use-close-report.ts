import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Report, request } from '../../api';
import { reportCacheKey } from './use-report';
import { reportsCacheKey } from './use-reports';

export const useCloseReport = (token: string, reportId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Report> => {
      const response = await request(
        token,
        `/api/admin/reports/${encodeURIComponent(reportId)}/close`,
        { method: 'POST' },
      );
      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reportCacheKey(reportId) }),
        queryClient.invalidateQueries({ queryKey: reportsCacheKey }),
      ]);
    },
  });
};
