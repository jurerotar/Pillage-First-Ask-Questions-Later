import type { paths } from '../../../../open-api';
import type { ControllerArgs } from '../../../types/controller';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export const createControllerArgs = <
  TPath extends keyof paths,
  TMethod extends Method = 'get',
  TBody = undefined,
>(
  args: Partial<ControllerArgs<TPath, TMethod, TBody>>,
): ControllerArgs<TPath, TMethod, TBody> => {
  return {
    params: (args.params ?? {}) as ControllerArgs<
      TPath,
      TMethod,
      TBody
    >['params'],
    query: (args.query ?? {}) as ControllerArgs<TPath, TMethod, TBody>['query'],
    body: (args.body ?? {}) as ControllerArgs<TPath, TMethod, TBody>['body'],
  };
};
