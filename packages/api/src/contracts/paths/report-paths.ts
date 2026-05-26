import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const reportPaths = {
  '/players/:playerId/reports': {
    get: {
      summary: 'Get my reports',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'List of reports',
          content: {
            'application/json': {
              schema: z.array(
                z.strictObject({
                  id: z.string(),
                  tags: z.array(z.enum(['read', 'archived'])),
                  timestamp: z.number().int(),
                  villageId: z.number().int(),
                }),
              ),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/reports/unread-count': {
    get: {
      summary: 'Get unread reports count',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Unread reports count',
          content: {
            'application/json': {
              schema: z.number().int(),
            },
          },
        },
      },
    },
  },
  '/reports/:reportId': {
    patch: {
      summary: 'Update report',
      requestParams: {
        path: z.strictObject({
          reportId: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tag: z.enum(['read', 'archived']),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Updated',
        },
      },
    },
    delete: {
      summary: 'Delete report',
      requestParams: {
        path: z.strictObject({
          reportId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Deleted',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
