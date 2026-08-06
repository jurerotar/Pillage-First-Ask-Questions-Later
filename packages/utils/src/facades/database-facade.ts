/** biome-ignore-all lint/suspicious/noConsole: We're using debug statements to test query performance in development */
import type { OpfsSAHPoolDatabase, SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import type {
  ExecArgs,
  ExecQueryArgs,
  SelectArgs,
} from './database-query-types';

type PreparedStatement = ReturnType<OpfsSAHPoolDatabase['prepare']>;

const queryPlanRowSchema = z.strictObject({
  id: z.number(),
  parent: z.number(),
  notused: z.number(),
  detail: z.string(),
});

export type DbQueryPlanRow = z.infer<typeof queryPlanRowSchema>;

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

  /** returns SQLite EXPLAIN QUERY PLAN rows without executing the original query */
  explain: (args: ExecQueryArgs) => DbQueryPlanRow[];

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
  close: () => void;
};

type RunStatementArgs<Result> = {
  sql: string;
  bind?: ExecQueryArgs['bind'];
  operation: string;
  execute: (statement: PreparedStatement) => Result;
};

const trimSqlPrefix = (sql: string): string => {
  let remainingSql = sql.trimStart();

  while (true) {
    if (remainingSql.startsWith('--')) {
      const newlineIndex = remainingSql.search(/\r?\n/u);

      if (newlineIndex === -1) {
        return '';
      }

      remainingSql = remainingSql.slice(newlineIndex).trimStart();
      continue;
    }

    if (remainingSql.startsWith('/*')) {
      const commentEndIndex = remainingSql.indexOf('*/');

      if (commentEndIndex === -1) {
        return '';
      }

      remainingSql = remainingSql.slice(commentEndIndex + 2).trimStart();
      continue;
    }

    return remainingSql;
  }
};

const canExplainQueryPlan = (sql: string): boolean => {
  return /^(?:delete|insert|replace|select|update|with)\b/iu.test(
    trimSqlPrefix(sql),
  );
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

  const explainQueryPlan = ({ sql, bind }: ExecQueryArgs): DbQueryPlanRow[] => {
    return z
      .array(queryPlanRowSchema)
      .parse(database.selectObjects(`EXPLAIN QUERY PLAN ${sql}`, bind));
  };

  const getDebugQueryPlan = ({
    sql,
    bind,
  }: Pick<RunStatementArgs<unknown>, 'sql' | 'bind'>):
    | DbQueryPlanRow[]
    | undefined => {
    if (!canExplainQueryPlan(sql)) {
      return;
    }

    try {
      return explainQueryPlan({ sql, bind });
    } catch {
      // Some SQL forms cannot be explained; debug logging must not block execution.
    }

    return undefined;
  };

  const runStatement = <Result>({
    sql,
    bind,
    operation,
    execute,
  }: RunStatementArgs<Result>): Result => {
    const queryPlan = debug ? getDebugQueryPlan({ sql, bind }) : undefined;

    const t0 = debug ? performance.now() : 0;
    const statement = getStatement(sql);

    statement.reset(true);

    if (bind) {
      statement.bind(bind);
    }

    try {
      const result = execute(statement);

      if (debug) {
        const t1 = performance.now();
        console.log(
          `DbFacade.${operation} — ${sql} took ${(t1 - t0).toFixed(3)} ms`,
          ...(queryPlan === undefined ? [] : [queryPlan]),
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

    explain: explainQueryPlan,

    selectValue: ({ sql, bind, schema }) => {
      const value = runStatement({
        sql,
        bind,
        operation: 'selectValue',
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
        operation: 'selectValues',
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
        return z.parse(schema, row);
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

      return parseArray(schema, rows);
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
