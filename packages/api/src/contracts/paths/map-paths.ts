import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { tileLoyaltyDtoSchema } from '@pillage-first/types/dtos/loyalty';
import {
  mapMarkerDtoSchema,
  mapTileDtoSchema,
  mapTileOasisBonusDtoSchema,
  mapTileTroopDtoSchema,
  mapTileWorldItemDtoSchema,
} from '@pillage-first/types/dtos/map';
import { mapFiltersDtoSchema } from '@pillage-first/types/dtos/map-filters';

export const mapPaths = {
  '/tiles': {
    get: {
      summary: 'Get all tiles',
      responses: {
        '200': {
          description: 'List of all tiles',
          content: {
            'application/json': {
              schema: z.array(mapTileDtoSchema.nullable()),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/troops': {
    get: {
      summary: 'Get troops on a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Troops on tile',
          content: {
            'application/json': {
              schema: z.array(mapTileTroopDtoSchema),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/bonuses': {
    get: {
      summary: 'Get oasis bonuses on a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Oasis bonuses',
          content: {
            'application/json': {
              schema: z.array(mapTileOasisBonusDtoSchema),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/world-item': {
    get: {
      summary: 'Get world item on a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'World item on tile',
          content: {
            'application/json': {
              schema: mapTileWorldItemDtoSchema.nullable(),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/loyalty': {
    get: {
      summary: 'Get current loyalty of a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Tile loyalty',
          content: {
            'application/json': {
              schema: tileLoyaltyDtoSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/map-markers': {
    get: {
      summary: 'Get map markers',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Map markers',
          content: {
            'application/json': {
              schema: z.array(mapMarkerDtoSchema),
            },
          },
        },
      },
    },
    post: {
      summary: 'Add map marker',
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
              description: z.string(),
              color: mapMarkerDtoSchema.shape.color,
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Marker added',
        },
      },
    },
  },
  '/players/:playerId/map-markers/:tileId': {
    delete: {
      summary: 'Remove map marker',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Marker removed',
        },
      },
    },
  },
  '/players/:playerId/map-filters': {
    get: {
      summary: 'Get map filters',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Map filters',
          content: {
            'application/json': {
              schema: mapFiltersDtoSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/map-filters/:filterName': {
    patch: {
      summary: 'Update map filter',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          filterName: z.string(),
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
          description: 'Filter updated',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
