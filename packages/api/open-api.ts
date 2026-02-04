import 'zod-openapi';
import { createDocument, type ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';
import {
  getPlayerVillagesWithPopulationSchema,
  getVillagesByPlayerSchema,
} from './src/controllers/schemas/player-schemas';
import { playerSchema } from '@pillage-first/types/models/player';

export const paths = {
  '/players/:playerId/villages': {
    get: {
      summary: 'Get player village listing',
      requestParams: {
        path: z.strictObject({
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Object with village listing',
          content: {
            'application/json': {
              schema: getVillagesByPlayerSchema,
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Object with villages and population',
          content: {
            'application/json': {
              schema: getPlayerVillagesWithPopulationSchema,
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

export const document = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Pillage First! worker-based API',
    version: '1.0.0',
    description: 'Proof of Concept for zod-openapi',
  },
  paths,
});
