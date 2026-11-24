import { z } from 'zod';
import {
  battleOutcomeSchema,
  battleParticipantSchema,
  battleSchema,
  battleStatisticsSchema,
  battleTroopsSchema,
  battleUnitSchema,
} from '../models/battle';

// Null means withheld information, rather than zero troops or no losses.
const reportUnitSchema = z.strictObject({
  ...battleUnitSchema.shape,
  amountHospitalized: battleUnitSchema.shape.amountHospitalized.nullable(),
  amountBandaged: battleUnitSchema.shape.amountBandaged.nullable(),
});

const reportParticipantSchema = z.strictObject({
  ...battleParticipantSchema.shape,
  troops: z.strictObject({
    ...battleTroopsSchema.shape,
    units: z.array(reportUnitSchema).nullable(),
  }),
});

export const battleReportBattleDtoSchema = z.strictObject({
  ...battleSchema.shape,
  attacker: reportParticipantSchema,
  defender: z.strictObject({
    ...reportParticipantSchema.shape,
    reinforcements: z.array(reportParticipantSchema),
  }),
  outcome: z.strictObject({
    ...battleOutcomeSchema.shape,
    villageDestroyed: battleOutcomeSchema.shape.villageDestroyed.nullable(),
    trapsDestroyed: battleOutcomeSchema.shape.trapsDestroyed.nullable(),
    rescuedUnits: battleOutcomeSchema.shape.rescuedUnits.nullable(),
    capturedAnimals: battleOutcomeSchema.shape.capturedAnimals.nullable(),
    stolenItems: battleOutcomeSchema.shape.stolenItems.nullable(),
  }),
  siegeResults: battleSchema.shape.siegeResults.nullable(),
  statistics: z.strictObject({
    attacker: battleStatisticsSchema,
    defender: battleStatisticsSchema.nullable(),
  }),
});
