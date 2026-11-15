import { z } from 'zod';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import {
  tradeRouteScheduleSchema,
  tradeRouteSchema,
} from '@pillage-first/types/models/trade-route';
import { getTotalResources } from './resources';

const tradeRouteFormSchema = tradeRouteScheduleSchema.safeExtend({
  startMinute: tradeRouteScheduleSchema.shape.startMinute.unwrap(),
  intervalMinutes: tradeRouteScheduleSchema.shape.intervalMinutes.unwrap(),
  targetVillageId: z.number().int().positive(),
  resources: resourcesSchema,
  minimumResources: resourcesSchema,
  minimumMerchants: tradeRouteSchema.shape.minimumMerchants,
});

export type MarketplaceTradeRouteFormValues = z.infer<
  typeof tradeRouteFormSchema
>;

export const createTradeRouteFormSchema = (
  targetVillageIds: number[],
  totalCapacity: number,
) =>
  tradeRouteFormSchema
    .refine(
      ({ targetVillageId }) => targetVillageIds.includes(targetVillageId),
      { message: 'Select a target village', path: ['targetVillageId'] },
    )
    .refine(({ resources }) => getTotalResources(resources) > 0, {
      message: 'Trade route must include resources',
      path: ['resources'],
    })
    .refine(({ resources }) => getTotalResources(resources) <= totalCapacity, {
      message: 'Not enough merchant capacity',
      path: ['resources'],
    });
