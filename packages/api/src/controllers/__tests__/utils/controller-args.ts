import type { paths } from '../../../open-api.ts';
import type { ControllerArgs } from '../../../utils/controller';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export const createControllerArgs = <
  TPath extends keyof typeof paths,
  TMethod extends Method = 'get',
  TBody = undefined,
>(
  args: Partial<ControllerArgs<TPath, TMethod, TBody>>,
): ControllerArgs<TPath, TMethod, TBody> => {
  return {
    path: (args.path ?? {}) as ControllerArgs<TPath, TMethod, TBody>['path'],
    query: (args.query ?? {}) as ControllerArgs<TPath, TMethod, TBody>['query'],
    body: (args.body ?? {}) as ControllerArgs<TPath, TMethod, TBody>['body'],
  };
};
