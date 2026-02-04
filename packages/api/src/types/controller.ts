import type { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { paths } from '../open-api.ts';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ControllerArgs<
  TPath extends string,
  TMethod extends Method = 'get',
  TBody = undefined,
> = {
  path: TPath extends keyof typeof paths
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
              content: {
                'application/json': { schema: infer B extends z.ZodTypeAny };
              };
            };
          }
          ? z.infer<B>
          : Record<string, any>
        : Record<string, any>
      : Record<string, any>
    : TBody;
};

export const createController = <
  TPath extends keyof typeof paths,
  TMethod extends Method = 'get',
>(
  _path: TPath,
  _method: TMethod = 'get' as TMethod,
) => {
  return <TReturn>(
    fn: (
      args: ControllerArgs<TPath, TMethod> & { database: DbFacade },
    ) => TReturn,
  ): ((
    database: DbFacade,
    args: ControllerArgs<TPath, TMethod>,
  ) => TReturn) => {
    return (
      database: DbFacade,
      args: ControllerArgs<TPath, TMethod>,
    ): TReturn => fn({ database, ...args });
  };
};
