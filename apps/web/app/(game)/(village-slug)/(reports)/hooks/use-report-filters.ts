import {
  type ReportListingFilter,
  reportListingFilterSchema,
} from '@pillage-first/types/dtos/report';
import { useFilters } from 'app/hooks/use-filters';

export const useReportFilters = () => {
  return useFilters<ReportListingFilter>({
    paramName: 'scope',
    defaultFilters: reportListingFilterSchema.options,
  });
};
