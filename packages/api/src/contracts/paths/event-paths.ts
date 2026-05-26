import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  baseEventDtoSchema,
  eventDtoSchema,
} from '@pillage-first/types/dtos/event';
import { gameEventTypeSchema } from '@pillage-first/types/models/game-event';

export const eventPaths = {
  '/villages/:villageId/events': {
    get: {
      summary: 'Get village events',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village events',
          content: {
            'application/json': {
              schema: z.array(baseEventDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/events/:eventType': {
    get: {
      summary: 'Get village events by type',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          eventType: z.union([gameEventTypeSchema, z.literal('troopMovement')]),
        }),
      },
      responses: {
        '200': {
          description: 'Village events by type',
          content: {
            'application/json': {
              schema: z.array(baseEventDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/events/demolition': {
    delete: {
      summary: 'Cancel demolition event',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Demolition event cancelled',
        },
      },
    },
  },
  '/events': {
    post: {
      summary: 'Create new events',
      requestBody: {
        content: {
          'application/json': {
            schema: z.optional(eventDtoSchema),
          },
        },
      },
      responses: {
        '204': {
          description: 'Events created',
        },
      },
    },
  },
  '/events/:eventId': {
    delete: {
      summary: 'Cancel event',
      requestParams: {
        path: z.strictObject({
          eventId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Event cancelled',
        },
      },
    },
  },
  '/events/unit-improvement-event/:eventId': {
    delete: {
      summary: 'Cancel unit improvement event',
      requestParams: {
        path: z.strictObject({
          eventId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Event cancelled',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
