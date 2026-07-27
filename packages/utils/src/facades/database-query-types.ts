import type { BindableValue } from '@sqlite.org/sqlite-wasm';
import type { $ZodType } from 'zod/v4/core';

type QueryBind = Record<`$${string}`, BindableValue>;

type QueryBindArgs = { bind?: QueryBind };

export type ExecArgs = {
  sql: string;
  bind?: QueryBind;
};

export type SelectArgs<T extends $ZodType> = {
  sql: string;
  schema: T;
} & QueryBindArgs;

export type ExecQueryArgs = {
  sql: string;
} & QueryBindArgs;
