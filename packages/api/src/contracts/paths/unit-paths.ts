import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  researchedUnitDtoSchema,
  unitImprovementDtoSchema,
} from '@pillage-first/types/dtos/unit';

export const unitPaths = {
  '/players/:playerId/unit-improvements': {
    get: {
      summary: 'Get unit improvements',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Unit improvements',
          content: {
            'application/json': {
              schema: z.array(unitImprovementDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/researched-units': {
    get: {
      summary: 'Get researched units in village',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Researched units',
          content: {
            'application/json': {
              schema: z.array(researchedUnitDtoSchema),
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
