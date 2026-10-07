import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getReports } from '../api';
import { reportsCacheKey } from '../reports/hooks/use-reports';

export const useSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => getReports(token),
    onSuccess: (reports) => {
      queryClient.setQueryData(reportsCacheKey, reports);
    },
  });
};
