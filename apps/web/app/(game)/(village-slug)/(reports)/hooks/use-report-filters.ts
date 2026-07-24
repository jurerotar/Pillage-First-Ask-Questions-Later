import type { ReportType } from '@pillage-first/types/models/report';
import { useFilters } from 'app/hooks/use-filters';

export const reportFilterTypes: ReportType[] = [
  'adventure',
  'battle',
  'scouting',
  'movement',
  'trade',
  'huntingParty',
  'gatheringExpedition',
];

export const useReportFilters = () => {
  return useFilters<ReportType>({
    paramName: 'scope',
    defaultFilters: reportFilterTypes,
  });
};
