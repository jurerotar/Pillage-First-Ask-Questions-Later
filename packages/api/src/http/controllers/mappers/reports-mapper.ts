import type { z } from 'zod';
import type { reportDtoSchema } from '@pillage-first/types/dtos/report';
import type { getReportSchema } from '../schemas/report-schemas';

export const mapReports = (
  row: z.infer<typeof getReportSchema>,
): z.infer<typeof reportDtoSchema> => {
  const dto = {
    id: row.id,
    villageId: row.village_id,
    timestamp: row.timestamp,
    type: row.type,
    is_read: Boolean(row.is_read),
    is_archived: Boolean(row.is_archived),
  };

  return dto;
};
