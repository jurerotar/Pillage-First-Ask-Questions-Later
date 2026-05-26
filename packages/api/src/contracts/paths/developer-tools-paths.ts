import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { developerSettingsSchema } from '@pillage-first/types/models/developer-settings';
import { resourceSchema } from '@pillage-first/types/models/resource';

export const developerToolsPaths = {
  '/developer-settings': {
    get: {
      summary: 'Get developer settings',
      responses: {
        '200': {
          description: 'Developer settings',
          content: {
            'application/json': {
              schema: developerSettingsSchema,
            },
          },
        },
      },
    },
  },
  '/developer-settings/:developerSettingName': {
    patch: {
      summary: 'Update developer setting',
      requestParams: {
        path: z.strictObject({
          developerSettingName: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              value: z.boolean(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Setting updated',
        },
      },
    },
  },
  '/developer-settings/:heroId/level-up': {
    patch: {
      summary: 'Level up hero',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Hero leveled up',
        },
      },
    },
  },
  '/developer-settings/:heroId/spawn-item': {
    patch: {
      summary: 'Spawn hero item',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              itemId: z.number(),
              amount: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Item spawned',
        },
      },
    },
  },
  '/developer-settings/:villageId/resources': {
    patch: {
      summary: 'Update village resources',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              resource: resourceSchema,
              amount: z.number(),
              direction: z.enum(['add', 'subtract']),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Resources updated',
        },
      },
    },
  },
  '/developer-settings/:heroId/increment-adventure-points': {
    patch: {
      summary: 'Increment hero adventure points',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Adventure points incremented',
        },
      },
    },
  },
  '/developer-settings/:heroId/kill': {
    patch: {
      summary: 'Kill hero',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Hero killed',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
