import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { apiEffectDtoSchema } from '@pillage-first/types/dtos/effect';
import { occupiableOasisDtoSchema } from '@pillage-first/types/dtos/oasis';
import { villageTroopDtoSchema } from '@pillage-first/types/dtos/player';
import {
  troopMovementItemDtoSchema,
  troopMovementStatsItemDtoSchema,
} from '@pillage-first/types/dtos/troop-movement';
import { villageBySlugDtoSchema } from '@pillage-first/types/dtos/village';
import { buildingIdSchema } from '@pillage-first/types/models/building';

export const villagePaths = {
  '/villages/:villageId/troops': {
    get: {
      summary: 'Get troops by village',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Troops listing',
          content: {
            'application/json': {
              schema: z.array(villageTroopDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId': {
    patch: {
      summary: 'Rename village',
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
          description: 'Village renamed',
        },
      },
    },
  },
  '/villages/:villageSlug': {
    get: {
      summary: 'Get village by slug',
      requestParams: {
        path: z.strictObject({
          villageSlug: z.string(),
        }),
      },
      responses: {
        '200': {
          description: 'Village details',
          content: {
            'application/json': {
              schema: villageBySlugDtoSchema,
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/occupiable-oasis': {
    get: {
      summary: 'Get occupiable oasis in range',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Occupiable oasis listing',
          content: {
            'application/json': {
              schema: z.array(occupiableOasisDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/building-fields': {
    patch: {
      summary: 'Rearrange building fields',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.array(
              z.strictObject({
                buildingFieldId: z.number(),
                buildingId: buildingIdSchema.nullable(),
              }),
            ),
          },
        },
      },
      responses: {
        '204': {
          description: 'Building fields rearranged',
        },
      },
    },
  },
  '/villages/:villageId/bookmarks': {
    get: {
      summary: 'Get bookmarks',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Bookmarks map',
          content: {
            'application/json': {
              schema: z.record(z.string(), z.string()),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/bookmarks/:buildingId': {
    patch: {
      summary: 'Update bookmark',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          buildingId: buildingIdSchema,
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tab: z.string(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Bookmark updated',
        },
      },
    },
  },
  '/villages/:villageId/effects': {
    get: {
      summary: 'Get village effects',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village effects',
          content: {
            'application/json': {
              schema: z.array(apiEffectDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/troop-movements': {
    get: {
      summary: 'Get village troop movements',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'List of troop movements',
          content: {
            'application/json': {
              schema: z.array(troopMovementItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/troop-movements/stats': {
    get: {
      summary: 'Get village troop movement stats',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Troop movement stats',
          content: {
            'application/json': {
              schema: z.array(troopMovementStatsItemDtoSchema),
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
