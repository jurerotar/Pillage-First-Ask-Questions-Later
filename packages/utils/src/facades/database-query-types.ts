import type { BindableValue } from '@sqlite.org/sqlite-wasm';
import type { SnakeCase } from 'type-fest';
import type { z } from 'zod';

type LowercaseLetter =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';

type SqlIdentifierStart = '_' | LowercaseLetter | Uppercase<LowercaseLetter>;

type SqlIdentifierPart =
  | SqlIdentifierStart
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

type TakeSqlIdentifier<
  Value extends string,
  Identifier extends string = '',
> = Value extends `${infer Character}${infer Rest}`
  ? Character extends SqlIdentifierPart
    ? TakeSqlIdentifier<Rest, `${Identifier}${Character}`>
    : Identifier
  : Identifier;

type ExtractSqlBindParams<Sql extends string> =
  Sql extends `${string}$${infer AfterDollar}`
    ? AfterDollar extends `${infer FirstCharacter}${infer Rest}`
      ? FirstCharacter extends SqlIdentifierStart
        ? `$${TakeSqlIdentifier<AfterDollar>}` | ExtractSqlBindParams<Rest>
        : ExtractSqlBindParams<Rest>
      : never
    : never;

type QueryBind<Sql extends string> = string extends Sql
  ? Record<SnakeCase<string>, BindableValue>
  : {
      [Param in ExtractSqlBindParams<Sql>]: BindableValue;
    };

type QueryBindArgs<Sql extends string> = string extends Sql
  ? { bind?: QueryBind<Sql> }
  : [ExtractSqlBindParams<Sql>] extends [never]
    ? { bind?: QueryBind<Sql> }
    : { bind: QueryBind<Sql> };

export type ExecArgs = {
  sql: string;
  bind?: QueryBind<string>;
};

export type SelectArgs<T extends z.ZodType, Sql extends string = string> = {
  sql: Sql;
  schema: T;
} & QueryBindArgs<Sql>;

export type ExecQueryArgs<Sql extends string = string> = {
  sql: Sql;
} & QueryBindArgs<Sql>;
