import {
  battleCombatantSchema,
  battleDefenderSchema,
  battleOutcomeSchema,
  battlePlayerSchema,
  battleSchema,
  battleSummarySchema,
  battleTroopsSchema,
  battleUnitSchema,
  battleVillageSchema,
} from '../models/battle';

export const battleUnitDtoSchema = battleUnitSchema;

export const battleTroopsDtoSchema = battleTroopsSchema;

export const battlePlayerDtoSchema = battlePlayerSchema;

export const battleVillageDtoSchema = battleVillageSchema;

export const battleCombatantDtoSchema = battleCombatantSchema;

export const battleDefenderDtoSchema = battleDefenderSchema;

export const battleOutcomeDtoSchema = battleOutcomeSchema;

export const battleSummaryDtoSchema = battleSummarySchema;

export const battleDtoSchema = battleSchema;
