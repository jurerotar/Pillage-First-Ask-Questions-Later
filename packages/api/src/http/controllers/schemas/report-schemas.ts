import { z } from 'zod';
import { reportTypeSchema } from '@pillage-first/types/models/report';

export const getReportsByPlayerRowSchema = z
  .strictObject({
    id: z.int(),
    player_id: z.int(),
    village_id: z.int(),
    timestamp: z.int(),
    subject: z.string(),
    type: reportTypeSchema,
    is_read: z.int(),
    is_archived: z.int(),
  })
  .meta({ id: 'GetReportsByPlayerRow' });
