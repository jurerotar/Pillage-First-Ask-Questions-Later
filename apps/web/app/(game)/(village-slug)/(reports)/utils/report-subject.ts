import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { Report } from '@pillage-first/types/models/report';

export const getReportSubject = (report: ReportListingDto | Report): string => {
  if (report.type !== 'battle') {
    return '';
  }

  const { movementType, originName, targetName, targetCoordinates } =
    report.summary;
  const { x, y } = targetCoordinates;

  return `${originName} ${movementType === 'raid' ? 'raids' : 'attacks'} ${targetName} (${x}|${y})`;
};
