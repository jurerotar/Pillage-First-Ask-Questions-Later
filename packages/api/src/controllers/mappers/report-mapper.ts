import type { z } from 'zod';
import {
  battleReportPayloadDtoSchema,
  reportDtoSchema,
  reportListItemDtoSchema,
} from '@pillage-first/types/dtos/report';
import type { ReportRow } from '../schemas/report-schemas';

export const mapReportRowToDto = (
  row: ReportRow,
): z.infer<typeof reportDtoSchema> => {
  const payload = battleReportPayloadDtoSchema.parse(JSON.parse(row.payload));

  return reportDtoSchema.parse({
    id: row.id,
    type: row.type,
    timestamp: row.timestamp,
    villageId: row.village_id,
    defenderTileId: row.defender_tile_id,
    outcome: row.outcome,
    tags: row.tags,
    payload,
  });
};

export const mapReportRowToListItemDto = (
  row: ReportRow,
): z.infer<typeof reportListItemDtoSchema> => {
  return reportListItemDtoSchema.parse({
    id: row.id,
    type: row.type,
    timestamp: row.timestamp,
    villageId: row.village_id,
    outcome: row.outcome,
    tags: row.tags,
  });
};
