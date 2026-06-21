import type { z } from 'zod';
import type { reportDtoSchema } from '@pillage-first/types/dtos/report';
import type { getReportsByPlayerRowSchema } from '../schemas/report-schemas';

export const mapReports = (
  row: z.infer<typeof getReportsByPlayerRowSchema>,
): z.infer<typeof reportDtoSchema> => {
  const dto = {
    id: row.id,
    playerId: row.player_id,
    villageId: row.village_id,
    timestamp: row.timestamp,
    subject: row.subject,
    type: row.type,
    isRead: Boolean(row.is_read),
    isArchived: Boolean(row.is_archived),
  };

  return dto;
};
