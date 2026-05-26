import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { serverSchema } from '@pillage-first/types/models/server';

export const serverPaths = {
  '/server': {
    get: {
      summary: 'Get server details',
      responses: {
        '200': {
          description: 'Server details',
          content: {
            'application/json': {
              schema: serverSchema,
            },
          },
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;
