import type { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { paths } from '../open-api.ts';

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

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
          : Record<string, unknown>
        : Record<string, unknown>
      : Record<string, unknown>
    : TBody;
};

export type Controller<
  TPath extends keyof typeof paths = keyof typeof paths,
  TMethod extends Method = Method,
  TReturn = unknown,
> = {
  (database: DbFacade, args: ControllerArgs<TPath, TMethod>): TReturn;
  path: TPath;
  method: TMethod;
};

export const createController = <
  TPath extends keyof typeof paths,
  TMethod extends Method = 'get',
>(
  path: TPath,
  method: TMethod = 'get' as TMethod,
) => {
  return <TReturn>(
    fn: (
      args: ControllerArgs<TPath, TMethod> & { database: DbFacade },
    ) => TReturn,
  ): Controller<TPath, TMethod, TReturn> => {
    const controller = ((
      database: DbFacade,
      args: ControllerArgs<TPath, TMethod>,
    ): TReturn => fn({ database, ...args })) as Controller<
      TPath,
      TMethod,
      TReturn
    >;

    controller.path = path;
    controller.method = method;

    return controller;
  };
};
