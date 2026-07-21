import { z } from 'zod';
import {
  adventureReportSchema,
  battleReportSchema,
  gatheringExpeditionReportSchema,
  huntingPartyReportSchema,
  movementReportSchema,
  tradeReportSchema,
} from '../models/report';

export const battleReportSummaryDtoSchema = battleReportSchema.omit({
  battle: true,
});

export const adventureReportSummaryDtoSchema = adventureReportSchema.omit({
  adventureId: true,
  itemId: true,
  itemAmount: true,
  healthBefore: true,
  healthAfter: true,
});

export const tradeReportSummaryDtoSchema = tradeReportSchema.omit({
  trade: true,
});

export const reportListingDtoSchema = z.discriminatedUnion('type', [
  battleReportSummaryDtoSchema,
  adventureReportSummaryDtoSchema,
  tradeReportSummaryDtoSchema,
  movementReportSchema.omit({ movement: true }),
  huntingPartyReportSchema.omit({ tribe: true, units: true }),
  gatheringExpeditionReportSchema.omit({
    tribe: true,
    units: true,
    loot: true,
  }),
]);

export type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
