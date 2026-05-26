import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const troopMovementPaths = {
  '/troop-movements/:eventId': {
    delete: {
      summary: 'Cancel troop movement',
      requestParams: {
        path: z.strictObject({
          eventId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Movement cancelled',
        },
      },
    },
  },
  '/troop-movements/validate': {
    post: {
      summary: 'Validate troop movement',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              type: z.string(),
              villageId: z.number(),
              targetCoordinates: z.strictObject({
                x: z.number(),
                y: z.number(),
              }),
              troops: z.array(
                z.strictObject({
                  unitId: unitIdSchema,
                  amount: z.number(),
                }),
              ),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Validation results',
          content: {
            'application/json': {
              schema: z.strictObject({
                errors: z.array(z.string()),
              }),
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
