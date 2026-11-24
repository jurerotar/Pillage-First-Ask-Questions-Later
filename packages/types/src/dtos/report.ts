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

const reportStateDtoSchema = z.strictObject({
  isRead: z.boolean(),
  isArchived: z.boolean(),
});

const battleDtoSchema = z.strictObject({
  ...battleReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const adventureDtoSchema = z.strictObject({
  ...adventureReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const tradeDtoSchema = z.strictObject({
  ...tradeReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const movementDtoSchema = z.strictObject({
  ...movementReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const huntingPartyDtoSchema = z.strictObject({
  ...huntingPartyReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const gatheringExpeditionDtoSchema = z.strictObject({
  ...gatheringExpeditionReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const scoutingDtoSchema = z.strictObject({
  ...scoutingReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const unitResearchDtoSchema = z.strictObject({
  ...unitResearchReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const unitImprovementDtoSchema = z.strictObject({
  ...unitImprovementReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const villageFoundedDtoSchema = z.strictObject({
  ...villageFoundedReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

const scheduledConstructionCancellationDtoSchema = z.strictObject({
  ...scheduledConstructionCancellationReportSchema.omit({ tags: true }).shape,
  ...reportStateDtoSchema.shape,
});

export const battleReportSummaryDtoSchema = battleDtoSchema.omit({
  battle: true,
});

export const adventureReportSummaryDtoSchema = adventureDtoSchema.omit({
  adventureId: true,
  itemId: true,
  itemAmount: true,
  healthBefore: true,
  healthAfter: true,
});

export const tradeReportSummaryDtoSchema = tradeDtoSchema.omit({
  trade: true,
});

export const reportListingDtoSchema = z.discriminatedUnion('type', [
  battleReportSummaryDtoSchema,
  adventureReportSummaryDtoSchema,
  tradeReportSummaryDtoSchema,
  movementDtoSchema.omit({ movement: true }),
  huntingPartyDtoSchema.omit({ tribe: true, units: true }),
  gatheringExpeditionDtoSchema.omit({
    tribe: true,
    units: true,
    loot: true,
  }),
  scoutingDtoSchema.omit({ scouting: true }),
  unitResearchDtoSchema,
  unitImprovementDtoSchema,
  villageFoundedDtoSchema.omit({ originTileId: true, targetTileId: true }),
  scheduledConstructionCancellationDtoSchema,
]);

export const reportDtoSchema = z.discriminatedUnion('type', [
  battleDtoSchema,
  adventureDtoSchema,
  tradeDtoSchema,
  movementDtoSchema,
  huntingPartyDtoSchema,
  gatheringExpeditionDtoSchema,
  scoutingDtoSchema,
  unitResearchDtoSchema,
  unitImprovementDtoSchema,
  villageFoundedDtoSchema,
  scheduledConstructionCancellationDtoSchema,
]);

export type ReportDto = z.infer<typeof reportDtoSchema>;
export type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
export type ReportListingFilter = z.infer<typeof reportListingFilterSchema>;
export type ReportScope = z.infer<typeof reportScopeSchema>;
export type ReportFiltersDto = z.infer<typeof reportFiltersDtoSchema>;
