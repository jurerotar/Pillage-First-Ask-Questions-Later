import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

type JsonRequestBody = {
  content?: {
    'application/json'?: {
      schema?: z.ZodType;
    };
  };
};

export type ControllerOperation = {
  summary?: string;
  requestParams?: {
    path?: z.ZodType;
    query?: z.ZodType;
  };
  requestBody?: JsonRequestBody;
  responses?: Record<string, unknown>;
};

export type ControllerOperationConfig = Omit<
  ControllerOperation,
  'requestBody'
> & {
  requestBody?: z.ZodType | JsonRequestBody;
  response?: z.ZodType;
};

type ResponseSchemaFor<TOperation> = TOperation extends {
  response: infer TSchema extends z.ZodType;
}
  ? TSchema
  : never;

type NormalizeControllerOperation<
  TOperation extends ControllerOperationConfig,
> = Omit<TOperation, 'requestBody' | 'response' | 'responses'> &
  (TOperation extends { requestBody: infer TRequestBody extends z.ZodType }
    ? {
        requestBody: {
          content: {
            'application/json': {
              schema: TRequestBody;
            };
          };
        };
      }
    : TOperation extends {
          requestBody: infer TRequestBody extends JsonRequestBody;
        }
      ? { requestBody: TRequestBody }
      : Record<never, never>) &
  (TOperation extends { response: z.ZodType }
    ? {
        responses: {
          '200': {
            description: string;
            content: {
              'application/json': {
                schema: ResponseSchemaFor<TOperation>;
              };
            };
          };
        };
      }
    : TOperation extends {
          responses: infer TResponses extends Record<string, unknown>;
        }
      ? { responses: TResponses }
      : {
          responses: {
            '204': {
              description: string;
            };
          };
        });

type RequestBodySchemaFor<TOperation> = TOperation extends {
  requestBody: infer TRequestBody;
}
  ? TRequestBody extends z.ZodType
    ? TRequestBody
    : TRequestBody extends {
          content: {
            'application/json': { schema: infer TSchema extends z.ZodType };
          };
        }
      ? TSchema
      : never
  : never;

export type ControllerArgs<
  TPath extends string,
  TMethod extends Method = 'get',
  TBody = undefined,
  TOperation extends ControllerOperationConfig = ControllerOperationConfig,
> = {
  readonly __route?: {
    path: TPath;
    method: TMethod;
  };
  path: TOperation extends {
    requestParams: { path: infer P extends z.ZodType };
  }
    ? z.infer<P>
    : Record<string, unknown>;
  query: TOperation extends {
    requestParams: { query: infer Q extends z.ZodType };
  }
    ? z.infer<Q>
    : Record<string, unknown>;
  url: string;
  body: TBody extends undefined
    ? RequestBodySchemaFor<TOperation> extends infer B extends z.ZodType
      ? z.infer<B>
      : Record<string, unknown>
    : TBody;
};

export type Controller<
  TPath extends string = string,
  TMethod extends Method = Method,
  TOperation extends ControllerOperation = ControllerOperation,
  TReturn = unknown,
> = {
  (
    database: DbFacade,
    args: ControllerArgs<TPath, TMethod, undefined, TOperation>,
  ): TReturn;
  path: TPath;
  method: TMethod;
  operation: TOperation;
};

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
  response: infer TResponseSchema extends z.ZodType;
}
  ? InferOutputSchema<TResponseSchema>
  : TOperation extends {
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
    : undefined;

export function createController<
  const TPath extends string,
  const TOperation extends ControllerOperationConfig,
>(
  path: TPath,
  operation: TOperation,
): <TReturn = SuccessResponseFor<TOperation>>(
  fn: (
    args: ControllerArgs<TPath, 'get', undefined, TOperation> & {
      database: DbFacade;
    },
  ) => TReturn,
) => Controller<
  TPath,
  'get',
  NormalizeControllerOperation<TOperation>,
  TReturn
>;

export function createController<
  const TPath extends string,
  const TMethod extends Method,
  const TOperation extends ControllerOperationConfig,
>(
  path: TPath,
  method: TMethod,
  operation: TOperation,
): <TReturn = SuccessResponseFor<TOperation>>(
  fn: (
    args: ControllerArgs<TPath, TMethod, undefined, TOperation> & {
      database: DbFacade;
    },
  ) => TReturn,
) => Controller<
  TPath,
  TMethod,
  NormalizeControllerOperation<TOperation>,
  TReturn
>;

export function createController<
  const TPath extends string,
  const TMethod extends Method,
  const TOperation extends ControllerOperationConfig,
>(
  path: TPath,
  methodOrOperation: TMethod | TOperation,
  maybeOperation?: TOperation,
) {
  const method =
    typeof methodOrOperation === 'string' ? methodOrOperation : 'get';
  const operation =
    typeof methodOrOperation === 'string' ? maybeOperation! : methodOrOperation;
  const normalizedOperation = normalizeControllerOperation(operation);

  return <TReturn = SuccessResponseFor<TOperation>>(
    fn: (
      args: ControllerArgs<TPath, TMethod, undefined, TOperation> & {
        database: DbFacade;
      },
    ) => TReturn,
  ): Controller<
    TPath,
    TMethod,
    NormalizeControllerOperation<TOperation>,
    TReturn
  > => {
    const controller = ((
      database: DbFacade,
      args: ControllerArgs<TPath, TMethod, undefined, TOperation>,
    ): TReturn => fn({ database, ...args })) as unknown as Controller<
      TPath,
      TMethod,
      NormalizeControllerOperation<TOperation>,
      TReturn
    >;

    controller.path = path;
    controller.method = method as TMethod;
    controller.operation = normalizedOperation;

    return controller;
  };
}

const normalizeControllerOperation = <
  TOperation extends ControllerOperationConfig,
>(
  operation: TOperation,
): NormalizeControllerOperation<TOperation> => {
  const { response, ...rest } = operation;
  const normalizedRequestBody =
    rest.requestBody instanceof z.ZodType
      ? {
          content: {
            'application/json': {
              schema: rest.requestBody,
            },
          },
        }
      : rest.requestBody;

  return {
    ...rest,
    ...(normalizedRequestBody ? { requestBody: normalizedRequestBody } : {}),
    responses: response
      ? {
          '200': {
            description: operation.summary ?? 'OK',
            content: {
              'application/json': {
                schema: response,
              },
            },
          },
        }
      : (operation.responses ?? {
          '204': {
            description: operation.summary ?? 'No Content',
          },
        }),
  } as NormalizeControllerOperation<TOperation>;
};

export const getJsonRequestBodySchema = (
  requestBody: ControllerOperationConfig['requestBody'],
) =>
  requestBody instanceof z.ZodType
    ? requestBody
    : requestBody?.content?.['application/json']?.schema;
