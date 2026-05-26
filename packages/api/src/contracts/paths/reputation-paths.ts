import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { reputationSchema } from '@pillage-first/types/models/reputation';

export const reputationPaths = {
  '/players/:playerId/reputations': {
    get: {
      summary: 'Get player faction reputations',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Faction reputations',
          content: {
            'application/json': {
              schema: z.array(reputationSchema),
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
