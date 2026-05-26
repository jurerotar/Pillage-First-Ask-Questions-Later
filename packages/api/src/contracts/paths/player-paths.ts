import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
} from '@pillage-first/types/dtos/player';
import { playerSchema } from '@pillage-first/types/models/player';

export const playerPaths = {
  '/players/me': {
    get: {
      summary: 'Get current player details',
      responses: {
        '200': {
          description: 'Current player details',
          content: {
            'application/json': {
              schema: playerSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/villages': {
    get: {
      summary: 'Get player village listing',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Object with village listing',
          content: {
            'application/json': {
              schema: z.array(playerVillageDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/villages-with-population': {
    get: {
      summary: 'Get player villages with population',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Object with villages and population',
          content: {
            'application/json': {
              schema: z.array(playerVillageWithPopulationDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerSlug': {
    get: {
      summary: 'Get player by slug',
      requestParams: {
        path: z.strictObject({
          playerSlug: playerSchema.shape.slug,
        }),
      },
      responses: {
        '200': {
          description: 'Player details',
          content: {
            'application/json': {
              schema: playerSchema,
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
