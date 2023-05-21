import React, { useMemo } from 'react';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game/game-context';
import { Report } from 'interfaces/models/game/report';
import { NavigationButton } from './navigation-button';

export const ReportsContainer: React.FC = () => {
  const reports = useContextSelector(GameContext, (v) => v.reports);

  const unopenedReportCount = useMemo<number>(() => {
    if (!reports) {
      return 0;
    }
    return reports.filter((report: Report) => !report.opened).length;
  }, [reports]);

  return (
    <div className="relative">
      <NavigationButton
        onClick={() => {
        }}
        variant="reports"
        size="sm"
      />
      {unopenedReportCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-[2px] text-xs text-white">
          {unopenedReportCount}
        </span>
      )}
    </div>
  );
};
