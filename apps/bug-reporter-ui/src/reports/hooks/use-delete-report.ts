import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { type Report, request } from '../../api';
import { reportCacheKey } from './use-report';
import { reportsCacheKey } from './use-reports';

export const useDeleteReport = (token: string, reportId: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await request(
        token,
        `/api/admin/reports/${encodeURIComponent(reportId)}`,
        { method: 'DELETE' },
      );
    },
    onSuccess: async () => {
      queryClient.setQueryData<Report[]>(reportsCacheKey, (reports) =>
        reports?.filter((item) => item.id !== reportId),
      );
      await navigate('/');
      queryClient.removeQueries({ queryKey: reportCacheKey(reportId) });
      await queryClient.invalidateQueries({ queryKey: reportsCacheKey });
    },
  });
};
