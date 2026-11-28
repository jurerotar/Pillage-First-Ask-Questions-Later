import type {
  OpfsSAHPoolDatabase,
  Sqlite3Static,
  SqlValue,
} from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import type {
  ExecArgs,
  ExecQueryArgs,
  SelectArgs,
} from './database-query-types';

export type OpfsSahPoolOptions = Parameters<
  Sqlite3Static['installOpfsSAHPoolVfs']
>[0];

type PreparedStatement = ReturnType<OpfsSAHPoolDatabase['prepare']>;

type CachedStatement = {
  statement: PreparedStatement;
  exposed: boolean;
};

const parseArray = <T extends z.core.$ZodType>(
  schema: T,
  values: unknown[],
): z.core.output<T>[] => {
  return z.array(schema).parse(values);
};

const clearBindingsAfterExecution = (statement: PreparedStatement): void => {
  const reset = statement.reset.bind(statement);
  const stepReset = statement.stepReset.bind(statement);

  statement.reset = () => reset(true);
  statement.stepReset = () => {
    try {
      return stepReset();
    } finally {
      reset(true);
    }
  };
};

export type DbFacade = {
  exec: (args: ExecQueryArgs) => void;
  execMulti: (args: ExecQueryArgs) => void;

  /** returns a single *value* validated against `schema`. undefined if not found */
  selectValue: <T extends z.core.$ZodType>(
    args: SelectArgs<T>,
  ) => z.core.output<T> | undefined;

  /** returns an array of values validated against `schema` (empty array if nothing found) */
  selectValues: <T extends z.core.$ZodType>(
    args: SelectArgs<T>,
  ) => z.core.output<T>[];

  /** single row object validated against schema (use a z.strictObject(...) schema) */
  selectObject: <T extends z.core.$ZodType>(
    args: SelectArgs<T>,
  ) => z.core.output<T> | undefined;

  /** many row objects validated against schema */
  selectObjects: <T extends z.core.$ZodType>(
    args: SelectArgs<T>,
  ) => z.core.output<T>[];

  prepare: ({
    sql,
  }: Pick<ExecArgs, 'sql'>) => ReturnType<OpfsSAHPoolDatabase['prepare']>;
  transaction: (callback: (db: DbFacade) => void) => void;
  serialize: () => Uint8Array;
  close: () => void;
};

type RunStatementArgs<Result> = {
  sql: string;
  bind?: ExecQueryArgs['bind'];
  execute: (statement: PreparedStatement) => Result;
};

export const createDbFacade = (
  database: OpfsSAHPoolDatabase,
  serialize = (): Uint8Array => {
    throw new Error('Database serialization is not available in this context.');
  },
): DbFacade => {
  const preparedStatementCache = new Map<string, CachedStatement>();

  const getStatement = (sql: string): CachedStatement => {
    const cached = preparedStatementCache.get(sql);
    if (cached) {
      return cached;
    }

    const prepared: CachedStatement = {
      statement: database.prepare(sql),
      exposed: false,
    };

    preparedStatementCache.set(sql, prepared);

    return prepared;
  };

  const runStatement = <Result>({
    sql,
    bind,
    execute,
  }: RunStatementArgs<Result>): Result => {
    const cached = getStatement(sql);
    const { statement } = cached;
    // A caller holding a raw statement may have bound or stepped it directly.
    if (cached.exposed) {
      statement.reset(true);
    }

    try {
      if (bind) {
        statement.bind(bind);
      }
      return execute(statement);
    } finally {
      statement.reset(true);
    }
  };

  const facade: DbFacade = {
    exec: ({ sql, bind }): void => {
      runStatement({
        sql,
        bind,
        execute: (statement) => statement.step(),
      });
    },

    execMulti: ({ sql, bind }): void => {
      database.exec({ sql, bind });
    },

    selectValue: ({ sql, bind, schema }) => {
      const value = runStatement({
        sql,
        bind,
        execute: (statement) =>
          statement.step() ? statement.get(0) : undefined,
      });

      if (value === undefined) {
        return;
      }

      return z.parse(schema, value);
    },

    selectValues: ({ sql, bind, schema }) => {
      const values = runStatement({
        sql,
        bind,
        execute: (statement) => {
          const values: SqlValue[] = [];

          while (statement.step()) {
            values.push(statement.get(0));
          }

          return values;
        },
      });

      return parseArray(schema, values);
    },

    selectObject: ({ sql, bind, schema }) => {
      const row = runStatement({
        sql,
        bind,
        execute: (statement) =>
          statement.step() ? statement.get({}) : undefined,
      });

      if (row !== undefined) {
        return z.parse(schema, row);
      }

      return;
    },

    selectObjects: ({ sql, bind, schema }) => {
      const rows = runStatement({
        sql,
        bind,
        execute: (statement) => {
          const rows: ReturnType<OpfsSAHPoolDatabase['selectObjects']> = [];
          while (statement.step()) {
            rows.push(statement.get({}));
          }
          return rows;
        },
      });

      return parseArray(schema, rows);
    },

    prepare: ({ sql }) => {
      const cached = getStatement(sql);
      if (!cached.exposed) {
        clearBindingsAfterExecution(cached.statement);
        cached.exposed = true;
      }
      return cached.statement.reset(true);
    },

    transaction: (callback: (db: DbFacade) => void): void => {
      database.transaction(() => {
        callback(facade);
      });
    },

    serialize,

    close: (): void => {
      for (const [key, { statement }] of preparedStatementCache) {
        statement.finalize();
        preparedStatementCache.delete(key);
      }
    },
  };

  return facade;
};
