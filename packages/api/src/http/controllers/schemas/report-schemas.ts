import { z } from 'zod';
import { reportTypeSchema } from '@pillage-first/types/models/report';

export const getReportSchema = z
  .strictObject({
    id: z.number(),
    village_id: z.number(),
    timestamp: z.number(),
    type: reportTypeSchema,
    is_read: z.number(),
    is_archived: z.number(),
  })
  .meta({ id: 'GetReportRow' });
