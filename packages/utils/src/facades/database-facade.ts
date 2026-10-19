import type { OpfsSAHPoolDatabase, SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import type {
  ExecArgs,
  ExecQueryArgs,
  SelectArgs,
} from './database-query-types';

type PreparedStatement = ReturnType<OpfsSAHPoolDatabase['prepare']>;

const parseArray = <T extends z.core.$ZodType>(
  schema: T,
  values: unknown[],
): z.core.output<T>[] => {
  return z
    .array(schema as unknown as z.ZodType)
    .parse(values) as z.core.output<T>[];
};

const createPreparedStatementCache = (): Map<string, PreparedStatement> => {
  return new Map<string, PreparedStatement>();
};

const clearBindingsAfterExecution = (
  statement: PreparedStatement,
): PreparedStatement => {
  const reset = statement.reset.bind(statement);
  const stepReset = statement.stepReset.bind(statement);

  statement.reset = (() => reset(true)) as PreparedStatement['reset'];
  statement.stepReset = (() => {
    try {
      return stepReset();
    } finally {
      reset(true);
    }
  }) as PreparedStatement['stepReset'];

  return statement;
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
  const preparedStatementCache = createPreparedStatementCache();

  const getStatement = (sql: string): PreparedStatement => {
    const statement = preparedStatementCache.get(sql);

    if (!statement) {
      const preparedStatement = clearBindingsAfterExecution(
        database.prepare(sql),
      );
      preparedStatementCache.set(sql, preparedStatement);

      return preparedStatement;
    }

    return statement;
  };

  const runStatement = <Result>({
    sql,
    bind,
    execute,
  }: RunStatementArgs<Result>): Result => {
    const statement = getStatement(sql);

    statement.reset(true);

    if (bind) {
      statement.bind(bind);
    }

    try {
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
        execute: (statement) => statement.stepReset(),
      });
    },

    execMulti: ({ sql, bind }): void => {
      database.exec({ sql, bind });
    },

    selectValue: ({ sql, bind, schema }) => {
      const value = runStatement({
        sql,
        bind,
        execute: (statement) => {
          const isDataAvailable = statement.step();

          if (!isDataAvailable) {
            statement.reset();

            return;
          }

          const value = statement.get(0);
          statement.reset();

          return value;
        },
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

          statement.reset();

          return values;
        },
      });

      return parseArray(schema, values);
    },

    selectObject: ({ sql, bind, schema }) => {
      const row = runStatement({
        sql,
        bind,
        execute: (statement) => {
          const isDataAvailable = statement.step();

          if (isDataAvailable) {
            const row = statement.get({});
            statement.reset();

            return row;
          }

          statement.reset();

          return;
        },
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
          statement.reset();

          return rows;
        },
      });

      return parseArray(schema, rows);
    },

    prepare: ({ sql }) => {
      return runStatement({
        sql,
        execute: (statement) => statement,
      });
    },

    transaction: (callback: (db: DbFacade) => void): void => {
      database.transaction(() => {
        callback(facade);
      });
    },

    serialize,

    close: (): void => {
      for (const [key, stmt] of preparedStatementCache) {
        stmt.finalize();
        preparedStatementCache.delete(key);
      }
    },
  };

  return facade;
};
