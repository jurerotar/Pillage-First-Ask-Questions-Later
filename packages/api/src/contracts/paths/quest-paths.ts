import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { questSchema } from '@pillage-first/types/models/quest';

export const questPaths = {
  '/villages/:villageId/quests': {
    get: {
      summary: 'Get village quests',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village quests',
          content: {
            'application/json': {
              schema: z.array(questSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/quests/collectables/count': {
    get: {
      summary: 'Get collectable quests count',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Collectable quests count',
          content: {
            'application/json': {
              schema: z.strictObject({
                collectableQuestCount: z.number(),
              }),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/quests/:questId/collect': {
    patch: {
      summary: 'Collect quest reward',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          questId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Reward collected',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
