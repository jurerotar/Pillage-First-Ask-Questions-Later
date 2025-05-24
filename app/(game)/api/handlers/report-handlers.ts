import type { ApiHandler } from 'app/interfaces/api';
import { reportsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Report } from 'app/interfaces/models/game/report';

export const getReports: ApiHandler<Report[]> = async (queryClient) => {
  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];
  return reports;
};
