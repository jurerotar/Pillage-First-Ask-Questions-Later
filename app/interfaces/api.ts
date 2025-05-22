import type { QueryClient } from '@tanstack/react-query';
import type { apiRoutes } from 'app/(game)/api/api-routes';

type ApiHandlerArgs<TBody, TParams> = {
  body: TBody;
  params: TParams;
};

export type ApiHandler<TReturn, TParams = Record<string, string>, TBody = Record<string, string>> = (
  queryClient: QueryClient,
  args: ApiHandlerArgs<TBody, TParams>,
) => Promise<TReturn>;

type RouteDef = (typeof apiRoutes)[number];

export type ApiRoute = RouteDef['path'];
export type ApiMethod = RouteDef['method'];

export type ExtractHandler<TPath extends ApiRoute, TMethod extends ApiMethod> = Extract<
  RouteDef,
  { path: TPath; method: TMethod }
>['handler'];

export type HandlerArgs<TPath extends ApiRoute, TMethod extends ApiMethod> = Parameters<ExtractHandler<TPath, TMethod>>[1];

export type HandlerReturn<TPath extends ApiRoute, TMethod extends ApiMethod> = Awaited<ReturnType<ExtractHandler<TPath, TMethod>>>;
