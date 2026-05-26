import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { preferencesSchema } from '@pillage-first/types/models/preferences';

export const preferencesPaths = {
  '/players/:playerId/preferences': {
    get: {
      summary: 'Get player preferences',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Player preferences',
          content: {
            'application/json': {
              schema: preferencesSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/preferences/:preferenceName': {
    patch: {
      summary: 'Update player preference',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          preferenceName: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              value: z.union([z.boolean(), z.enum(['detailed', 'compact'])]),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Preference updated',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
