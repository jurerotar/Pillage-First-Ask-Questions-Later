import { z } from 'zod';
import {
  adventureReportSchema,
  battleReportSchema,
  movementReportSchema,
  tradeReportSchema,
} from '../models/report';

export const battleReportSummaryDtoSchema = battleReportSchema.omit({
  battle: true,
});

export const adventureReportSummaryDtoSchema = adventureReportSchema.omit({
  adventureId: true,
  itemId: true,
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
]);

export type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
