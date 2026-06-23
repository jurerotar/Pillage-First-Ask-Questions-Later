import type { z } from 'zod';
import {
  type baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getBattle } from '../../../utils/report';
import type { getReportsRowSchema } from '../schemas/report-schemas';

export const mapReports = (
  row: z.infer<typeof getReportsRowSchema>,
): z.infer<typeof baseReportDtoSchema> => {
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

export const mapReport = (
  database: DbFacade,
  row: z.infer<typeof getReportsRowSchema>,
): z.infer<typeof reportDtoSchema> => {
  const baseReport = {
    id: row.id,
    playerId: row.player_id,
    villageId: row.village_id,
    timestamp: row.timestamp,
    subject: row.subject,
    isRead: Boolean(row.is_read),
    isArchived: Boolean(row.is_archived),
  };

  // const isBattle = row.type === 'battle';

  // TODO: Support other types
  // if (isBattle) {
  const battle = getBattle(database, row.id);
  const dto = {
    type: 'battle' as const,
    battle,
    ...baseReport,
  };
  return reportDtoSchema.parse(dto);
  // }
};
