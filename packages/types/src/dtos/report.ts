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

const battleDtoSchema = battleReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const adventureDtoSchema = adventureReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const tradeDtoSchema = tradeReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const movementDtoSchema = movementReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const huntingPartyDtoSchema = huntingPartyReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const gatheringExpeditionDtoSchema = gatheringExpeditionReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const scoutingDtoSchema = scoutingReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const unitResearchDtoSchema = unitResearchReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const unitImprovementDtoSchema = unitImprovementReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const villageFoundedDtoSchema = villageFoundedReportSchema
  .omit({ tags: true })
  .extend(reportStateDtoSchema.shape);

const scheduledConstructionCancellationDtoSchema =
  scheduledConstructionCancellationReportSchema
    .omit({ tags: true })
    .extend(reportStateDtoSchema.shape);

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
