import { z } from 'zod';
import {
  reportOutcomeSchema,
  reportTagSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';

export const getReportsRowSchema = z
  .strictObject({
    id: z.int(),
    player_id: z.int(),
    village_id: z.int(),
    timestamp: z.int(),
    type: reportTypeSchema,
    outcome: reportOutcomeSchema,
    battle_is_raid: z.int().nullable(),
    battle_origin_name: z.string().nullable(),
    battle_target_name: z.string().nullable(),
    battle_target_x: z.int().nullable(),
    battle_target_y: z.int().nullable(),
    tag: reportTagSchema.nullable(),
  })
  .meta({ id: 'GetReportsRow' });
