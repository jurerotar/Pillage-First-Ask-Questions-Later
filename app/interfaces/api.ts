import type { QueryClient } from '@tanstack/react-query';

type ApiHandlerArgs<TBody, TParams> = {
  body: TBody;
  params: TParams;
};

export type ApiHandler<TReturn, TParams = Record<string, string>, TBody = Record<string, unknown>> = (
  queryClient: QueryClient,
  args: ApiHandlerArgs<TBody, TParams>,
) => Promise<TReturn>;
