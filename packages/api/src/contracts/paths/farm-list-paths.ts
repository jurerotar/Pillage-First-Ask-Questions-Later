import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  farmListDetailsDtoSchema,
  farmListDtoSchema,
  updateFarmListDtoSchema,
} from '@pillage-first/types/dtos/farm-list';

export const farmListPaths = {
  '/villages/:villageId/farm-lists': {
    get: {
      summary: 'Get farm lists',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Farm lists',
          content: {
            'application/json': {
              schema: z.array(farmListDtoSchema),
            },
          },
        },
      },
    },
    post: {
      summary: 'Create farm list',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              name: z.string(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Farm list created',
        },
      },
    },
  },
  '/players/:playerId/farm-lists': {
    get: {
      summary: 'Get player farm lists',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Farm lists',
          content: {
            'application/json': {
              schema: z.array(farmListDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/farm-lists/tiles': {
    delete: {
      summary: 'Remove tile from all player farm lists',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tileId: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Tile removed from all farm lists',
        },
      },
    },
  },
  '/farm-lists/:farmListId': {
    get: {
      summary: 'Get farm list details',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Farm list details',
          content: {
            'application/json': {
              schema: farmListDetailsDtoSchema,
            },
          },
        },
      },
    },
    patch: {
      summary: 'Update farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: updateFarmListDtoSchema,
          },
        },
      },
      responses: {
        '204': {
          description: 'Farm list updated',
        },
      },
    },
    delete: {
      summary: 'Delete farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Farm list deleted',
        },
      },
    },
  },
  '/farm-lists/:farmListId/tiles': {
    post: {
      summary: 'Add tile to farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tileId: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Tile added',
        },
      },
    },
  },
  '/farm-lists/:farmListId/clone': {
    post: {
      summary: 'Clone farm list to another village',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              villageId: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Farm list cloned',
        },
      },
    },
  },
  '/farm-lists/:farmListId/tiles/:tileId': {
    delete: {
      summary: 'Remove tile from farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Tile removed',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
