import { z } from 'zod';
import {
  adventureReportSchema,
  battleReportSchema,
  gatheringExpeditionReportSchema,
  huntingPartyReportSchema,
  movementReportSchema,
  reportTypeSchema,
  scheduledConstructionCancellationReportSchema,
  scoutingReportSchema,
  tradeReportSchema,
  unitImprovementReportSchema,
  unitResearchReportSchema,
  villageFoundedReportSchema,
} from '../models/report';

export const reportListingFilterSchema = z.enum([
  ...reportTypeSchema.options,
  'noLoss',
  'ownTrades',
]);

export const reportScopeSchema = z.enum([
  'global',
  'unread',
  'archived',
  'village',
]);

export const reportFilterNameByScope = {
  global: 'reports.global',
  unread: 'reports.unread',
  archived: 'reports.archived',
  village: 'reports.village',
} as const satisfies Record<z.infer<typeof reportScopeSchema>, string>;

export const reportFiltersDtoSchema = z.array(reportListingFilterSchema);

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
  scoutingReportSchema.omit({ scouting: true }),
  unitResearchReportSchema,
  unitImprovementReportSchema,
  villageFoundedReportSchema.omit({ originTileId: true, targetTileId: true }),
  scheduledConstructionCancellationReportSchema,
]);

export type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
export type ReportListingFilter = z.infer<typeof reportListingFilterSchema>;
export type ReportScope = z.infer<typeof reportScopeSchema>;
export type ReportFiltersDto = z.infer<typeof reportFiltersDtoSchema>;
