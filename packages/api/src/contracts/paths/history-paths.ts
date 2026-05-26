import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  buildingLevelChangeHistoryItemDtoSchema,
  eventsHistoryItemDtoSchema,
  unitTrainingHistoryItemDtoSchema,
} from '@pillage-first/types/dtos/history';
import { buildingIdSchema } from '@pillage-first/types/models/building';

export const historyPaths = {
  '/villages/:villageId/history/events': {
    get: {
      summary: 'Get village events history',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
        query: z.strictObject({
          page: z.coerce.number().optional().default(1),
          scope: z.enum(['village', 'global']).optional().default('village'),
          types: z
            .array(
              z.enum([
                'construction',
                'training',
                'improvement',
                'research',
                'founding',
              ]),
            )
            .or(
              z.enum([
                'construction',
                'training',
                'improvement',
                'research',
                'founding',
              ]),
            )
            .optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Village events history',
          content: {
            'application/json': {
              schema: z.array(eventsHistoryItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/history/buildings': {
    get: {
      summary: 'Get village building level change history',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village building level change history',
          content: {
            'application/json': {
              schema: z.array(buildingLevelChangeHistoryItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/history/units': {
    get: {
      summary: 'Get village unit training history',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
        query: z.strictObject({
          buildingId: buildingIdSchema.nullable().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Village unit training history',
          content: {
            'application/json': {
              schema: z.array(unitTrainingHistoryItemDtoSchema),
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
