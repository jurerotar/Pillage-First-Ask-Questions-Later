import { z } from 'zod';
import {
  adventureReportSchema,
  battleReportSchema,
  tradeReportSchema,
} from '../models/report';

export const battleReportSummaryDtoSchema = battleReportSchema.omit({
  battle: true,
});

export const reportListingDtoSchema = z.discriminatedUnion('type', [
  battleReportSummaryDtoSchema,
  adventureReportSchema,
  tradeReportSchema,
]);

export type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
