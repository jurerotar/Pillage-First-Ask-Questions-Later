import type { ControllerArgs } from '../../../controller';
import {
  createRequestContext,
  type RequestContext,
} from '../../../request-context';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'query';

export const createControllerArgs = <
  TPath extends string,
  TMethod extends Method = 'get',
  TBody = undefined,
>(
  args: Partial<{
    context: RequestContext;
    path: Record<string, unknown>;
    query: Record<string, unknown>;
    body: unknown;
    url: string;
  }>,
): ControllerArgs<TPath, TMethod, TBody, never> => {
  return {
    context: args.context ?? createRequestContext(),
    path: (args.path ?? {}) as ControllerArgs<
      TPath,
      TMethod,
      TBody,
      never
    >['path'],
    query: (args.query ?? {}) as ControllerArgs<
      TPath,
      TMethod,
      TBody,
      never
    >['query'],
    body: (args.body ?? {}) as ControllerArgs<
      TPath,
      TMethod,
      TBody,
      never
    >['body'],
    url: args.url ?? '',
  };
};
