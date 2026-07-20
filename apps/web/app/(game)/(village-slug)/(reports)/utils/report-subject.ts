import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { Report } from '@pillage-first/types/models/report';

export const getReportSubject = (report: ReportListingDto | Report): string => {
  if (report.type !== 'battle') {
    return '';
  }

  const { isRaid, originName, targetName, targetCoordinates } =
    report.battleSummary;
  const { x, y } = targetCoordinates;

  return `${originName} ${isRaid ? 'raids' : 'attacks'} ${targetName} (${x}|${y})`;
};
