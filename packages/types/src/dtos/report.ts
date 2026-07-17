import { z } from 'zod';
import {
  adventureReportSchema,
  battleReportSchema,
  gameReportSchema,
  tradeReportSchema,
} from '../models/report';

export const battleReportSummaryDtoSchema = battleReportSchema.omit({
  battle: true,
});

export const baseReportDtoSchema = z.discriminatedUnion('type', [
  battleReportSummaryDtoSchema,
  adventureReportSchema,
  tradeReportSchema,
]);

export const reportDtoSchema = gameReportSchema;

export type BattleReportSummaryDto = z.infer<
  typeof battleReportSummaryDtoSchema
>;
export type BaseReportDto = z.infer<typeof baseReportDtoSchema>;
export type ReportDto = z.infer<typeof reportDtoSchema>;
