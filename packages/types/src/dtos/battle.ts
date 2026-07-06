import { z } from 'zod';
import { battleStatisticsSchema } from '../models/battle';
import { coordinatesSchema } from '../models/coordinates';
import { resourceBundleSchema } from '../models/resource';
import { tribeSchema } from '../models/tribe';
import { unitIdSchema } from '../models/unit';

export const battleUnitDtoSchema = z.strictObject({
  battleParticipantId: z.int(),
  unitId: unitIdSchema,
  amountBefore: z.int(),
  amountAfter: z.int(),
});

export const battleParticipantDtoSchema = z.strictObject({
  id: z.int(),
  role: z.enum(['attacker', 'defender']),
  tribe: tribeSchema,
  isReinforcement: z.boolean(),
  units: z.array(battleUnitDtoSchema),
});

export const battleDtoSchema = z
  .strictObject({
    attackingVillageId: z.int(),
    defendingVillageId: z.int().optional(),
    defendingOasisId: z.int().optional(),
    attackingPlayerName: z.string(),
    attackingPlayerSlug: z.string(),
    defendingPlayerName: z.string(),
    defendingPlayerSlug: z.string().optional(),
    originName: z.string(),
    originCoordinates: coordinatesSchema,
    targetName: z.string(),
    targetCoordinates: coordinatesSchema,
    loot: resourceBundleSchema,
    totalCarryCapacity: z.int(),
    didAttackerWin: z.boolean(),
    canAttackerSeeFullReport: z.boolean(),
    attackStatistics: battleStatisticsSchema,
    defenceStatistics: battleStatisticsSchema,
    participants: z.array(battleParticipantDtoSchema),
  })
  .refine(
    ({ defendingVillageId, defendingOasisId }) =>
      defendingVillageId != null || defendingOasisId != null,
    'Either the defending village or oasis ID must be defined',
  );
