/** biome-ignore-all lint/suspicious/noConsole: We're using debug statements to test query performance in development */
import type { OpfsSAHPoolDatabase, SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import type {
  ExecArgs,
  ExecQueryArgs,
  SelectArgs,
} from './database-query-types';

type PreparedStatement = ReturnType<OpfsSAHPoolDatabase['prepare']>;

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
  exec: <const Sql extends string>(args: ExecQueryArgs<Sql>) => void;

  /** returns a single *value* validated against `schema`. undefined if not found */
  selectValue: <T extends z.ZodType, const Sql extends string>(
    args: SelectArgs<T, Sql>,
  ) => z.infer<T> | undefined;

  /** returns an array of values validated against `schema` (empty array if nothing found) */
  selectValues: <T extends z.ZodType, const Sql extends string>(
    args: SelectArgs<T, Sql>,
  ) => z.infer<T>[];

  /** single row object validated against schema (use a z.strictObject(...) schema) */
  selectObject: <T extends z.ZodType, const Sql extends string>(
    args: SelectArgs<T, Sql>,
  ) => z.infer<T> | undefined;

  /** many row objects validated against schema */
  selectObjects: <T extends z.ZodType, const Sql extends string>(
    args: SelectArgs<T, Sql>,
  ) => z.infer<T>[];

  prepare: ({
    sql,
  }: Pick<ExecArgs, 'sql'>) => ReturnType<OpfsSAHPoolDatabase['prepare']>;
  transaction: (callback: (db: DbFacade) => void) => void;
  close: () => void;
};

type RunStatementArgs<Result> = {
  sql: string;
  bind?: ExecQueryArgs['bind'];
  operation: string;
  execute: (statement: PreparedStatement) => Result;
};

export const createDbFacade = (
  database: OpfsSAHPoolDatabase,
  debug = false,
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
    operation,
    execute,
  }: RunStatementArgs<Result>): Result => {
    const t0 = performance.now();
    const statement = getStatement(sql);

    statement.reset(true);

    if (bind) {
      statement.bind(bind);
    }

    try {
      const result = execute(statement);
      const t1 = performance.now();

      if (debug) {
        console.log(
          `DbFacade.${operation} — ${sql} took ${(t1 - t0).toFixed(3)} ms`,
        );
      }

      return result;
    } finally {
      statement.reset(true);
    }
  };

  const facade: DbFacade = {
    exec: ({ sql, bind }): void => {
      runStatement({
        sql,
        bind,
        operation: 'exec',
        execute: (statement) => statement.stepReset(),
      });
    },

    selectValue: ({ sql, bind, schema }) => {
      const row = runStatement({
        sql,
        bind,
        operation: 'selectValue',
        execute: (statement) => {
          const isDataAvailable = statement.step();

          if (!isDataAvailable) {
            statement.reset();

            return [];
          }

          const row = statement.get([]);
          statement.reset();

          return row;
        },
      });

      const data = row.at(0);

      if (data === undefined) {
        return;
      }

      return schema.parse(data);
    },

    selectValues: ({ sql, bind, schema }) => {
      const values = runStatement({
        sql,
        bind,
        operation: 'selectValues',
        execute: (statement) => {
          const values: SqlValue[] = [];

          while (statement.step()) {
            const row = statement.get([]);
            values.push(row.at(0)!);
          }

          statement.reset();

          return values;
        },
      });

      return z.array(schema).parse(values);
    },

    selectObject: ({ sql, bind, schema }) => {
      const row = runStatement({
        sql,
        bind,
        operation: 'selectObject',
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
        return schema.parse(row);
      }

      return;
    },

    selectObjects: ({ sql, bind, schema }) => {
      const rows = runStatement({
        sql,
        bind,
        operation: 'selectObjects',
        execute: (statement) => {
          const rows: ReturnType<OpfsSAHPoolDatabase['selectObjects']> = [];
          while (statement.step()) {
            rows.push(statement.get({}));
          }
          statement.reset();

          return rows;
        },
      });

      return z.array(schema).parse(rows);
    },

    prepare: ({ sql }) => {
      return runStatement({
        sql,
        operation: 'prepare',
        execute: (statement) => statement,
      });
    },

    transaction: (callback: (db: DbFacade) => void): void => {
      const t0 = performance.now();
      database.transaction(() => {
        callback(facade);
      });
      const t1 = performance.now();
      if (debug) {
        console.log(
          `DbFacade.transaction — full callback took ${(t1 - t0).toFixed(3)} ms`,
        );
      }
    },

    close: (): void => {
      for (const [key, stmt] of preparedStatementCache) {
        stmt.finalize();
        preparedStatementCache.delete(key);
      }
    },
  };

  return facade;
};
