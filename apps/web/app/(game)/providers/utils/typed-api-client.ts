import type { ApiRoutesByMethod } from '@pillage-first/api/api-route-types';
import type { Fetcher } from 'app/(game)/providers/utils/worker-fetch';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete' | 'query';

type PathForMethod<TMethod extends HttpMethod> = Extract<
  keyof ApiRoutesByMethod[TMethod],
  string
>;

type RouteFor<
  TPath extends PathForMethod<TMethod>,
  TMethod extends HttpMethod,
> = ApiRoutesByMethod[TMethod][TPath];

type OperationFor<TRoute> = TRoute extends {
  operation: infer TOperation;
}
  ? TOperation
  : never;

type ParametersFor<TOperation> = TOperation extends {
  requestParams: infer TRequestParams;
}
  ? TRequestParams
  : never;

type PathParamsFor<TRoute> =
  ParametersFor<OperationFor<TRoute>> extends {
    path?: infer TPathParams;
  }
    ? TPathParams
    : never;

type QueryParamsFor<TRoute> =
  ParametersFor<OperationFor<TRoute>> extends {
    query?: infer TQueryParams;
  }
    ? TQueryParams
    : never;

type BodyFor<TRoute> =
  OperationFor<TRoute> extends {
    requestBody: infer TBody;
  }
    ? TBody
    : never;

type ResponseFor<TRoute> =
  OperationFor<TRoute> extends { response: infer TResponse }
    ? TResponse
    : never;

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
  query: ApiClientMethod<'query'>;
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
    if (value === null || value === undefined) {
      continue;
    }

    // Properly serialize arrays as repeated query params (e.g., ?types=a&types=b)
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === null || v === undefined) {
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

    const { data } = await fetcher(url, {
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
    query: request.bind(null, 'query') as ApiClientMethod<'query'>,
  };
};
