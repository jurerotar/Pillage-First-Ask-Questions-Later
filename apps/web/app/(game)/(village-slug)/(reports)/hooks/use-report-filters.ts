import type { ReportType } from '@pillage-first/types/models/report';
import { useFilters } from 'app/hooks/use-filters';

export const reportFilterTypes: ReportType[] = ['adventure', 'battle', 'trade'];

export const useReportFilters = () => {
  return useFilters<ReportType>({
    paramName: 'reports',
    defaultFilters: reportFilterTypes,
  });
};
