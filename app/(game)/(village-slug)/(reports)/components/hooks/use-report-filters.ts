import { useState } from 'react';
import type { ReportType } from 'app/interfaces/models/game/report';

export const useReportFilters = () => {
  const [reportFilters, setReportFilters] = useState<ReportType[]>([
    'adventure',
    'attack',
    'raid',
    'defence',
    'scout-attack',
    'scout-defence',
    'trade',
  ]);

  const onReportFiltersChange = (newReportFilters: ReportType[]) => {
    setReportFilters(newReportFilters);
  };

  return {
    reportFilters,
    onReportFiltersChange,
  };
};
