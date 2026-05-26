import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  playerRankingItemDtoSchema,
  serverOverviewStatisticsDtoSchema,
  villageRankingItemDtoSchema,
} from '@pillage-first/types/dtos/statistics';

export const statisticsPaths = {
  '/statistics/players': {
    get: {
      summary: 'Get player rankings',
      requestParams: {
        query: z.strictObject({
          lastPlayerId: z.coerce.number().nullable().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Player rankings',
          content: {
            'application/json': {
              schema: z.array(playerRankingItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/statistics/villages': {
    get: {
      summary: 'Get village rankings',
      requestParams: {
        query: z.strictObject({
          lastVillageId: z.coerce.number().nullable().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Village rankings',
          content: {
            'application/json': {
              schema: z.array(villageRankingItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/statistics/overview': {
    get: {
      summary: 'Get game world overview statistics',
      responses: {
        '200': {
          description: 'Overview statistics',
          content: {
            'application/json': {
              schema: serverOverviewStatisticsDtoSchema,
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
