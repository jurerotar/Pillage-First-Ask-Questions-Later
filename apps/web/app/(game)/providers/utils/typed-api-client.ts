import type { z } from 'zod';
import type { paths } from '@pillage-first/api/open-api';
import type { Fetcher } from 'app/(game)/providers/utils/worker-fetch';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
type OpenApiPaths = typeof paths;

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

type InferInputSchema<TSchema> = TSchema extends z.ZodType
  ? z.input<TSchema>
  : never;

type InferOutputSchema<TSchema> = TSchema extends z.ZodType
  ? z.output<TSchema>
  : never;

type PathForMethod<TMethod extends HttpMethod> = {
  [TPath in keyof OpenApiPaths]: TMethod extends keyof OpenApiPaths[TPath]
    ? OpenApiPaths[TPath][TMethod] extends never
      ? never
      : TPath extends string
        ? TPath
        : never
    : never;
}[keyof OpenApiPaths];

type Operation<
  TPath extends PathForMethod<TMethod>,
  TMethod extends HttpMethod,
> = TMethod extends keyof OpenApiPaths[TPath]
  ? NonNullable<OpenApiPaths[TPath][TMethod]>
  : never;

type ParametersFor<TOperation> = TOperation extends {
  parameters: infer TParameters;
}
  ? TParameters
  : TOperation extends {
        requestParams: infer TRequestParams;
      }
    ? TRequestParams
    : never;

type PathParamsFor<TOperation> =
  ParametersFor<TOperation> extends {
    path?: infer TPathSchema;
  }
    ? InferInputSchema<NonNullable<TPathSchema>>
    : never;

type QueryParamsFor<TOperation> =
  ParametersFor<TOperation> extends {
    query?: infer TQuerySchema;
  }
    ? InferInputSchema<NonNullable<TQuerySchema>>
    : never;

type BodySchemaFor<TOperation> = TOperation extends {
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

type BodyFor<TOperation> = InferInputSchema<BodySchemaFor<TOperation>>;

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
            : never
    : never
  : never;

type PathParamOptions<TOperation> = [PathParamsFor<TOperation>] extends [never]
  ? { path?: never }
  : { path: PathParamsFor<TOperation> };

type QueryParamOptions<TOperation> = [QueryParamsFor<TOperation>] extends [
  never,
]
  ? { query?: never }
  : { query?: QueryParamsFor<TOperation> };

type BodyOptions<TOperation> = {
  body?: BodyFor<TOperation>;
};

type RequestOptions<TOperation> = PathParamOptions<TOperation> &
  QueryParamOptions<TOperation> &
  BodyOptions<TOperation>;

type HasRequiredOptions<TOperation> = [PathParamsFor<TOperation>] extends [
  never,
]
  ? [BodyFor<TOperation>] extends [never]
    ? false
    : true
  : true;

const buildPath = <TOperation>(
  pathTemplate: string,
  options?: Partial<RequestOptions<TOperation>>,
) => {
  const path = Object.entries(options?.path ?? {}).reduce(
    (acc, [name, value]) => {
      return acc.replace(`:${name}`, encodeURIComponent(String(value)));
    },
    pathTemplate,
  );

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

export const createTypedApiClient = (fetcher: Fetcher) => {
  const request = async <
    TMethod extends HttpMethod,
    TPath extends PathForMethod<TMethod>,
    TOperation extends Operation<TPath, TMethod> = Operation<TPath, TMethod>,
  >(
    method: TMethod,
    pathTemplate: TPath,
    ...[options]: HasRequiredOptions<TOperation> extends true
      ? [RequestOptions<TOperation>]
      : [RequestOptions<TOperation>?]
  ): Promise<{ data: SuccessResponseFor<TOperation> }> => {
    const url = buildPath<TOperation>(pathTemplate, options);

    const { data } = await fetcher<
      SuccessResponseFor<TOperation>,
      BodyFor<TOperation>
    >(url, {
      method: method.toUpperCase(),
      body: options?.body,
    });

    return {
      data,
    };
  };

  return {
    get: <TPath extends PathForMethod<'get'>>(
      pathTemplate: TPath,
      ...args: HasRequiredOptions<Operation<TPath, 'get'>> extends true
        ? [RequestOptions<Operation<TPath, 'get'>>]
        : [RequestOptions<Operation<TPath, 'get'>>?]
    ) => request<'get', TPath>('get', pathTemplate, ...args),
    post: <TPath extends PathForMethod<'post'>>(
      pathTemplate: TPath,
      ...args: HasRequiredOptions<Operation<TPath, 'post'>> extends true
        ? [RequestOptions<Operation<TPath, 'post'>>]
        : [RequestOptions<Operation<TPath, 'post'>>?]
    ) => request<'post', TPath>('post', pathTemplate, ...args),
    patch: <TPath extends PathForMethod<'patch'>>(
      pathTemplate: TPath,
      ...args: HasRequiredOptions<Operation<TPath, 'patch'>> extends true
        ? [RequestOptions<Operation<TPath, 'patch'>>]
        : [RequestOptions<Operation<TPath, 'patch'>>?]
    ) => request<'patch', TPath>('patch', pathTemplate, ...args),
    delete: <TPath extends PathForMethod<'delete'>>(
      pathTemplate: TPath,
      ...args: HasRequiredOptions<Operation<TPath, 'delete'>> extends true
        ? [RequestOptions<Operation<TPath, 'delete'>>]
        : [RequestOptions<Operation<TPath, 'delete'>>?]
    ) => request<'delete', TPath>('delete', pathTemplate, ...args),
  };
};
