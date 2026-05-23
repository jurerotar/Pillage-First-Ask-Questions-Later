import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import {
  reportOutcomeSchema,
  reportTagSchema,
  reportTypeSchema,
} from '../models/report';
import { unitIdSchema } from '../models/unit';

export const reportTroopRecordDtoSchema = z
  .strictObject({
    unitId: unitIdSchema,
    amount: z.number().int().nonnegative(),
    losses: z.number().int().nonnegative(),
  })
  .meta({ id: 'ReportTroopRecordDto' });

export const reportPartyDtoSchema = z
  .strictObject({
    playerId: z.number().nullable(),
    villageId: z.number().nullable(),
    villageName: z.string().nullable(),
    coordinates: coordinatesSchema,
  })
  .meta({ id: 'ReportPartyDto' });

export const battleReportPayloadDtoSchema = z
  .strictObject({
    attacker: reportPartyDtoSchema,
    defender: reportPartyDtoSchema,
    attackers: z.array(reportTroopRecordDtoSchema),
    defenders: z.array(reportTroopRecordDtoSchema),
    bonuses: z.strictObject({
      wallDefenceBonus: z.number(),
      wallDefenceBase: z.number(),
      moralBonus: z.number(),
      oasisDefenceBonus: z.number(),
    }),
    loot: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  })
  .meta({ id: 'BattleReportPayloadDto' });

export const reportDtoSchema = z
  .strictObject({
    id: z.number(),
    type: reportTypeSchema,
    timestamp: z.number(),
    villageId: z.number(),
    defenderTileId: z.number(),
    outcome: reportOutcomeSchema,
    tags: z.array(reportTagSchema),
    payload: battleReportPayloadDtoSchema,
  })
  .meta({ id: 'ReportDto' });

export const reportListItemDtoSchema = z
  .strictObject({
    id: z.number(),
    type: reportTypeSchema,
    timestamp: z.number(),
    villageId: z.number(),
    outcome: reportOutcomeSchema,
    tags: z.array(reportTagSchema),
  })
  .meta({ id: 'ReportListItemDto' });
