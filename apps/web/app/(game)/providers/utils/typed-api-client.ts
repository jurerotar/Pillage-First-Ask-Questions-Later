import type { z } from 'zod';
import type { apiRoutes } from '@pillage-first/api/api-routes';
import type { Fetcher } from 'app/(game)/providers/utils/worker-fetch';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';
type ApiRouteController = (typeof apiRoutes)[number]['controller'];

type RoutesByMethod = {
  [TMethod in HttpMethod]: {
    [TRoute in ApiRouteController as TRoute extends { method: TMethod }
      ? TRoute['path']
      : never]: TRoute;
  };
};

type PathForMethod<TMethod extends HttpMethod> = Extract<
  keyof RoutesByMethod[TMethod],
  string
>;

type RouteFor<
  TPath extends PathForMethod<TMethod>,
  TMethod extends HttpMethod,
> = RoutesByMethod[TMethod][TPath];

type OperationFor<TRoute> = TRoute extends {
  operation: infer TOperation;
}
  ? TOperation
  : never;

type InferInputSchema<TSchema> = TSchema extends z.core.$ZodType
  ? z.core.input<TSchema>
  : never;

type InferOutputSchema<TSchema> = TSchema extends z.core.$ZodType
  ? z.core.output<TSchema>
  : never;

type ParametersFor<TOperation> = TOperation extends {
  requestParams: infer TRequestParams;
}
  ? TRequestParams
  : never;

type PathParamsFor<TRoute> =
  ParametersFor<OperationFor<TRoute>> extends {
    path?: infer TPathSchema;
  }
    ? InferInputSchema<NonNullable<TPathSchema>>
    : never;

type QueryParamsFor<TRoute> =
  ParametersFor<OperationFor<TRoute>> extends {
    query?: infer TQuerySchema;
  }
    ? InferInputSchema<NonNullable<TQuerySchema>>
    : never;

type BodySchemaFor<TRoute> =
  OperationFor<TRoute> extends {
    requestBody?: infer TRequestBody;
  }
    ? NonNullable<TRequestBody> extends {
        content: {
          'application/json': {
            schema: infer TBodySchema;
          };
        };
      }
      ? TBodySchema
      : never
    : never;

type BodyFor<TRoute> = InferInputSchema<BodySchemaFor<TRoute>>;

type JsonSchemaFor<
  TOperation,
  TStatusCode extends string,
> = TOperation extends {
  responses: {
    [statusCode in TStatusCode]: {
      content: {
        'application/json': {
          schema: infer TSchema;
        };
      };
    };
  };
}
  ? TSchema
  : never;

type SuccessResponseFor<TRoute> =
  OperationFor<TRoute> extends infer TOperation
    ? TOperation extends { responses: infer TResponses }
      ? TResponses extends Record<string, unknown>
        ? '200' extends keyof TResponses
          ? InferOutputSchema<JsonSchemaFor<TOperation, '200'>>
          : '201' extends keyof TResponses
            ? InferOutputSchema<JsonSchemaFor<TOperation, '201'>>
            : '202' extends keyof TResponses
              ? InferOutputSchema<JsonSchemaFor<TOperation, '202'>>
              : '204' extends keyof TResponses
                ? undefined
                : never
        : never
      : never
    : never;

type ResponseFor<TRoute> = SuccessResponseFor<TRoute>;

type HasPathParams<TRoute> = TRoute extends {
  operation: { requestParams: { path: unknown } };
}
  ? true
  : false;

type HasQueryParams<TRoute> = TRoute extends {
  operation: { requestParams: { query: unknown } };
}
  ? true
  : false;

type HasBody<TRoute> = TRoute extends {
  operation: { requestBody: unknown };
}
  ? true
  : false;

type PathParamOptions<TRoute> =
  HasPathParams<TRoute> extends true
    ? { path: PathParamsFor<TRoute> }
    : { path?: never };

type QueryParamOptions<TRoute> =
  HasQueryParams<TRoute> extends true
    ? { query?: QueryParamsFor<TRoute> }
    : { query?: never };

type BodyOptions<TRoute> = {
  body?: BodyFor<TRoute>;
};

type RequestOptions<TRoute> = PathParamOptions<TRoute> &
  QueryParamOptions<TRoute> &
  BodyOptions<TRoute>;

type HasRequiredOptions<TRoute> =
  HasPathParams<TRoute> extends true
    ? true
    : HasBody<TRoute> extends true
      ? true
      : false;

type RequestArgs<TRoute> =
  HasRequiredOptions<TRoute> extends true
    ? [RequestOptions<TRoute>]
    : [RequestOptions<TRoute>?];

type ApiClientMethod<TMethod extends HttpMethod> = <
  TPath extends PathForMethod<TMethod>,
>(
  pathTemplate: TPath,
  ...args: RequestArgs<RouteFor<TPath, TMethod>>
) => Promise<{
  data: ResponseFor<RouteFor<TPath, TMethod>>;
}>;

export type ApiClient = {
  get: ApiClientMethod<'get'>;
  post: ApiClientMethod<'post'>;
  patch: ApiClientMethod<'patch'>;
  delete: ApiClientMethod<'delete'>;
};

type RuntimeRequestOptions = {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
};

const buildPath = (pathTemplate: string, options?: RuntimeRequestOptions) => {
  let path = pathTemplate;

  for (const [name, value] of Object.entries(options?.path ?? {})) {
    path = path.replace(`:${name}`, encodeURIComponent(String(value)));
  }

  if (!options?.query) {
    return path;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(options.query)) {
    if (value == null) {
      continue;
    }

    // Properly serialize arrays as repeated query params (e.g., ?types=a&types=b)
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v == null) {
          continue;
        }
        searchParams.append(key, String(v));
      }
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  return queryString ? `${path}?${queryString}` : path;
};

export const createTypedApiClient = (fetcher: Fetcher): ApiClient => {
  const request = async (
    method: HttpMethod,
    pathTemplate: string,
    options?: RuntimeRequestOptions,
  ): Promise<{ data: unknown }> => {
    const url = buildPath(pathTemplate, options);

    const { data } = await fetcher<unknown, unknown>(url, {
      method: method.toUpperCase(),
      body: options?.body,
    });

    return {
      data,
    };
  };

  return {
    get: request.bind(null, 'get') as ApiClientMethod<'get'>,
    post: request.bind(null, 'post') as ApiClientMethod<'post'>,
    patch: request.bind(null, 'patch') as ApiClientMethod<'patch'>,
    delete: request.bind(null, 'delete') as ApiClientMethod<'delete'>,
  };
};
