import type { z } from 'zod';
import {
  type baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getBattle } from '../../../utils/report';
import type { getReportsRowSchema } from '../schemas/report-schemas';

export const mapReports = (
  rows: z.infer<typeof getReportsRowSchema>[],
): z.infer<typeof baseReportDtoSchema>[] => {
  const reportMap = new Map<number, z.infer<typeof baseReportDtoSchema>>();

  for (const row of rows) {
    let report = reportMap.get(row.id);

    if (report === undefined) {
      report = {
        id: row.id,
        playerId: row.player_id,
        villageId: row.village_id,
        timestamp: row.timestamp,
        subject: row.subject,
        type: row.type,
        tags: [],
      };

      reportMap.set(report!.id, report!);
    }

    if (row.tag) {
      report!.tags.push(row.tag);
    }
  }

  return [...reportMap.values()];
};

export const mapReport = (
  database: DbFacade,
  rows: z.infer<typeof getReportsRowSchema>[],
): z.infer<typeof reportDtoSchema> => {
  const tags = [];
  for (const row of rows) {
    if (row.tag) {
      tags.push(row.tag);
    }
  }

  const row = rows[0];
  const baseReport = {
    id: row.id,
    playerId: row.player_id,
    villageId: row.village_id,
    timestamp: row.timestamp,
    subject: row.subject,
    tags,
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
