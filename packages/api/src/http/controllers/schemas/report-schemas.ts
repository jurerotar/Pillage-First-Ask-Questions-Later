import { z } from 'zod';
import {
  reportTagSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';

export const getReportsRowSchema = z
  .strictObject({
    id: z.int(),
    player_id: z.int(),
    village_id: z.int(),
    timestamp: z.int(),
    subject: z.string(),
    type: reportTypeSchema,
    tag: reportTagSchema.nullable(),
  })
  .meta({ id: 'GetReportsRow' });
