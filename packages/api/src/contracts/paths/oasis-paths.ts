import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  oasisByAnimalsSearchResultItemDtoSchema,
  oasisByBonusSearchResultItemDtoSchema,
} from '@pillage-first/types/dtos/oasis-search';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';

export const oasisPaths = {
  '/villages/:villageId/oasis/:oasisId': {
    post: {
      summary: 'Occupy oasis',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          oasisId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Oasis occupied',
        },
      },
    },
    delete: {
      summary: 'Abandon oasis',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          oasisId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Oasis abandoned',
        },
      },
    },
  },
  '/search/oases/by-bonus': {
    post: {
      summary: 'Find tiles with specific oasis bonuses',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              x: z.number(),
              y: z.number(),
              resourceFieldComposition: resourceFieldCompositionSchema.or(
                z.literal('any-cropper'),
              ),
              bonuses: z.strictObject({
                firstOasis: z.array(
                  z.strictObject({
                    bonus: z.union([z.literal(25), z.literal(50)]),
                    resource: resourceSchema,
                  }),
                ),
                secondOasis: z.array(
                  z.strictObject({
                    bonus: z.union([z.literal(25), z.literal(50)]),
                    resource: resourceSchema,
                  }),
                ),
                thirdOasis: z.array(
                  z.strictObject({
                    bonus: z.union([z.literal(25), z.literal(50)]),
                    resource: resourceSchema,
                  }),
                ),
              }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Tiles with bonuses',
          content: {
            'application/json': {
              schema: z.array(oasisByBonusSearchResultItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/search/oases/by-animals': {
    post: {
      summary: 'Find oasis tiles with specific nature troop amounts',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              x: z.number(),
              y: z.number(),
              animalFilters: z.array(
                z.strictObject({
                  animal: natureUnitIdSchema,
                  amount: z.number().min(1),
                }),
              ),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Oases that match the animal criteria',
          content: {
            'application/json': {
              schema: z.array(oasisByAnimalsSearchResultItemDtoSchema),
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
