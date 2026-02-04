import type { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { paths } from '../../open-api';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ControllerArgs<
  TPath extends string,
  TMethod extends Method = 'get',
  TBody = undefined,
> = {
  params: TPath extends keyof typeof paths
    ? TMethod extends keyof (typeof paths)[TPath]
      ? (typeof paths)[TPath][TMethod] extends {
          requestParams: { path: infer P extends z.ZodTypeAny };
        }
        ? z.infer<P>
        : Record<string, string | number>
      : Record<string, string | number>
    : Record<string, string | number>;
  query: TPath extends keyof typeof paths
    ? TMethod extends keyof (typeof paths)[TPath]
      ? (typeof paths)[TPath][TMethod] extends {
          requestParams: { query: infer Q extends z.ZodTypeAny };
        }
        ? z.infer<Q>
        : Record<string, string | number>
      : Record<string, string | number>
    : Record<string, string | number>;
  body: TBody extends undefined
    ? TPath extends keyof typeof paths
      ? TMethod extends keyof (typeof paths)[TPath]
        ? (typeof paths)[TPath][TMethod] extends {
            requestBody: {
              content: { 'application/json': { schema: infer B extends z.ZodTypeAny } };
            };
          }
          ? z.infer<B>
          : Record<string, any>
        : Record<string, any>
      : Record<string, any>
    : TBody;
};

export type Controller<
  TPath extends string,
  TMethod extends Method = 'get',
  TBody = undefined,
> = (
  database: DbFacade,
  args: ControllerArgs<TPath, TMethod, TBody>,
) => unknown;
