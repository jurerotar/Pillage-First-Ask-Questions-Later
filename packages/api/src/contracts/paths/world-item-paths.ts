import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { mapTileWorldItemDtoSchema } from '@pillage-first/types/dtos/map';

export const worldItemPaths = {
  '/villages/:villageId/artifacts': {
    get: {
      summary: 'Get artifacts around village',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Artifacts list',
          content: {
            'application/json': {
              schema: z.array(mapTileWorldItemDtoSchema),
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
