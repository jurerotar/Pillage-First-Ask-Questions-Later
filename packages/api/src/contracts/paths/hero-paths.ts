import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  heroDtoSchema,
  heroInventoryEntryDtoSchema,
  heroLoadoutEntryDtoSchema,
} from '@pillage-first/types/dtos/hero';
import { heroResourceToProduceSchema } from '@pillage-first/types/models/hero';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import { heroLoadoutSlotSchema } from '@pillage-first/types/models/hero-loadout';

export const heroPaths = {
  '/players/:playerId/hero': {
    get: {
      summary: 'Get hero details',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero details',
          content: {
            'application/json': {
              schema: heroDtoSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/hero/equipped-items': {
    get: {
      summary: 'Get hero loadout',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero loadout',
          content: {
            'application/json': {
              schema: z.array(heroLoadoutEntryDtoSchema),
            },
          },
        },
      },
    },
    patch: {
      summary: 'Equip hero item',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              itemId: z.number(),
              slot: heroLoadoutSlotSchema,
              amount: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Item equipped',
        },
      },
    },
  },
  '/players/:playerId/hero/inventory': {
    get: {
      summary: 'Get hero inventory',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero inventory',
          content: {
            'application/json': {
              schema: z.array(heroInventoryEntryDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/hero/adventures': {
    get: {
      summary: 'Get hero adventures',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero adventures',
          content: {
            'application/json': {
              schema: heroAdventuresSchema,
            },
          },
        },
      },
    },
    post: {
      summary: 'Start hero adventure',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Adventure started',
        },
      },
    },
  },
  '/players/:playerId/hero/attributes': {
    patch: {
      summary: 'Change hero attributes',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              attackPower: z.number().int().min(0).max(100),
              resourceProduction: z.number().int().min(0).max(100),
              attackBonus: z.number().int().min(0).max(100),
              defenceBonus: z.number().int().min(0).max(100),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Attributes changed',
        },
      },
    },
  },
  '/players/:playerId/hero/resource-to-produce': {
    patch: {
      summary: 'Change hero resource to produce',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              resource: heroResourceToProduceSchema,
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Resource to produce changed',
        },
      },
    },
  },
  '/players/:playerId/hero/equipped-items/:slot': {
    delete: {
      summary: 'Unequip hero item',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          slot: heroLoadoutSlotSchema,
        }),
      },
      responses: {
        '204': {
          description: 'Item unequipped',
        },
      },
    },
  },
  '/players/:playerId/hero/item': {
    post: {
      summary: 'Use hero item',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
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
          description: 'Item used',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
