import { z } from 'zod';
import { tribeSchema } from '@pillage-first/types/models/tribe';

export const getUnitImprovementsRowSchema = z
  .strictObject({
    unit_id: z.string(),
    level: z.number(),
  })
  .meta({ id: 'GetUnitImprovementsRow' });

export const getPlayerUnitCombatStatsPlayerRowSchema = z
  .strictObject({
    tribe: tribeSchema,
  })
  .meta({ id: 'GetPlayerUnitCombatStatsPlayerRow' });
