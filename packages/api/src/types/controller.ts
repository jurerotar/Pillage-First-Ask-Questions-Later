import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { paths } from '../../open-api';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ControllerArgs<
  TPath extends keyof paths,
  TMethod extends Method = 'get',
  TBody = undefined,
> = {
  params: paths[TPath][TMethod] extends { parameters: { path: infer P } }
    ? P
    : Record<string, never>;
  query: paths[TPath][TMethod] extends { parameters: { query: infer Q } }
    ? Q
    : Record<string, never>;
  body: TBody extends undefined
    ? paths[TPath][TMethod] extends {
        requestBody: { content: { 'application/json': infer B } };
      }
      ? B
      : Record<string, never>
    : TBody;
};

export type Controller<
  TPath extends keyof paths,
  TMethod extends Method = 'get',
  TBody = undefined,
> = (
  database: DbFacade,
  args: ControllerArgs<TPath, TMethod, TBody>,
) => unknown;
