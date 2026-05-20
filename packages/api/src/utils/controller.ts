import type { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { paths } from '../open-api';

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ControllerArgs<
  TPath extends string,
  TMethod extends Method = 'get',
  TBody = undefined,
> = {
  path: TPath extends keyof typeof paths
    ? TMethod extends keyof (typeof paths)[TPath]
      ? (typeof paths)[TPath][TMethod] extends {
          requestParams: { path: infer P extends z.ZodType };
        }
        ? z.infer<P>
        : Record<string, string | number>
      : Record<string, string | number>
    : Record<string, string | number>;
  query: TPath extends keyof typeof paths
    ? TMethod extends keyof (typeof paths)[TPath]
      ? (typeof paths)[TPath][TMethod] extends {
          requestParams: { query: infer Q extends z.ZodType };
        }
        ? z.infer<Q>
        : Record<string, string | number>
      : Record<string, string | number>
    : Record<string, string | number>;
  url: string;
  body: TBody extends undefined
    ? TPath extends keyof typeof paths
      ? TMethod extends keyof (typeof paths)[TPath]
        ? (typeof paths)[TPath][TMethod] extends {
            requestBody: {
              content: {
                'application/json': { schema: infer B extends z.ZodType };
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

type OperationFor<
  TPath extends keyof typeof paths,
  TMethod extends Method,
> = TMethod extends keyof (typeof paths)[TPath]
  ? NonNullable<(typeof paths)[TPath][TMethod]>
  : never;

type JsonSchemaFor<
  TOperation,
  TStatusCode extends string,
> = TOperation extends {
  responses: {
    [S in TStatusCode]: {
      content: {
        'application/json': { schema: infer TSchema };
      };
    };
  };
}
  ? TSchema
  : never;

type InferOutputSchema<TSchema> = TSchema extends z.ZodType
  ? z.output<TSchema>
  : never;

type SuccessResponseFor<TOperation> = TOperation extends {
  responses: infer TResponses;
}
  ? TResponses extends Record<string, unknown>
    ? '200' extends keyof TResponses
      ? InferOutputSchema<JsonSchemaFor<TOperation, '200'>>
      : '201' extends keyof TResponses
        ? InferOutputSchema<JsonSchemaFor<TOperation, '201'>>
        : '202' extends keyof TResponses
          ? InferOutputSchema<JsonSchemaFor<TOperation, '202'>>
          : '204' extends keyof TResponses
            ? undefined
            : unknown
    : unknown
  : unknown;

export const createController = <
  TPath extends keyof typeof paths,
  TMethod extends Method = 'get',
>(
  path: TPath,
  method: TMethod = 'get' as TMethod,
) => {
  return <TReturn = SuccessResponseFor<OperationFor<TPath, TMethod>>>(
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
