/** biome-ignore-all lint/suspicious/noConsole: We're using debug statements to test query performance in development */
import type { OpfsSAHPoolDatabase, SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';

const createPreparedStatementCache = (): Map<
  string,
  ReturnType<OpfsSAHPoolDatabase['prepare']>
> => {
  return new Map<string, ReturnType<OpfsSAHPoolDatabase['prepare']>>();
};

type ExecArgs = {
  sql: string;
  bind?: Parameters<OpfsSAHPoolDatabase['selectValue']>[1];
};

type SelectArgs<T extends z.ZodType> = {
  sql: string;
  bind?: Parameters<OpfsSAHPoolDatabase['selectValue']>[1];
  schema: T;
};

export type DbFacade = {
  exec: (args: ExecArgs) => void;

  /** returns a single *value* validated against `schema`. undefined if not found */
  selectValue: <T extends z.ZodType>(
    args: SelectArgs<T>,
  ) => z.infer<T> | undefined;

  /** returns an array of values validated against `schema` (empty array if nothing found) */
  selectValues: <T extends z.ZodType>(args: SelectArgs<T>) => z.infer<T>[];

  /** single row object validated against schema (use a z.strictObject(...) schema) */
  selectObject: <T extends z.ZodType>(
    args: SelectArgs<T>,
  ) => z.infer<T> | undefined;

  /** many row objects validated against schema */
  selectObjects: <T extends z.ZodType>(args: SelectArgs<T>) => z.infer<T>[];

  prepare: ({
    sql,
  }: Pick<ExecArgs, 'sql'>) => ReturnType<OpfsSAHPoolDatabase['prepare']>;
  transaction: (callback: (db: DbFacade) => void) => void;
  close: () => void;
};

export const createDbFacade = (
  database: OpfsSAHPoolDatabase,
  debug = false,
): DbFacade => {
  const preparedStatementCache = createPreparedStatementCache();

  const getStatement = (
    sql: string,
  ): ReturnType<OpfsSAHPoolDatabase['prepare']> => {
    const statement = preparedStatementCache.get(sql);

    if (!statement) {
      const preparedStatement = database.prepare(sql);
      preparedStatementCache.set(sql, preparedStatement);

      return preparedStatement;
    }

    return statement;
  };

  const facade: DbFacade = {
    exec: ({ sql, bind }): void => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }

      statement.stepReset();
      const t1 = performance.now();
      if (debug) {
        console.log(`DbFacade.exec — ${sql} took ${(t1 - t0).toFixed(3)} ms`);
      }
    },

    selectValue: ({ sql, bind, schema }) => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      statement.step();
      const row = statement.get([]);
      statement.reset();

      const t1 = performance.now();
      if (debug) {
        console.log(
          `DbFacade.selectValue — sql=${sql} took ${(t1 - t0).toFixed(
            3,
          )} ms; resultPresent=${Array.isArray(row) ? row.length > 0 : !!row}`,
        );
      }

      const data = row.at(0);

      if (data === undefined) {
        return undefined;
      }

      return schema.parse(data);
    },

    selectValues: ({ sql, bind, schema }) => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }

      const values: SqlValue[] = [];

      while (statement.step()) {
        const row = statement.get([]);
        values.push(row.at(0)!);
      }

      statement.reset();

      const t1 = performance.now();
      if (debug) {
        console.log(
          `DbFacade.selectValues — sql=${sql} took ${(t1 - t0).toFixed(
            3,
          )} ms; rows=${values.length}`,
        );
      }

      return z.array(schema).parse(values);
    },

    selectObject: ({ sql, bind, schema }) => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      const isDataAvailable = statement.step();

      if (isDataAvailable) {
        const row = statement.get({});
        statement.reset();
        const t1 = performance.now();
        if (debug) {
          console.log(
            `DbFacade.selectObject — sql=${sql} took ${(t1 - t0).toFixed(
              3,
            )} ms; present=true`,
          );
        }

        return schema.parse(row);
      }

      statement.reset();
      const t1 = performance.now();
      if (debug) {
        console.log(
          `DbFacade.selectObject — sql=${sql} took ${(t1 - t0).toFixed(
            3,
          )} ms; present=false`,
        );
      }

      return undefined;
    },

    selectObjects: ({ sql, bind, schema }) => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      const rows: ReturnType<OpfsSAHPoolDatabase['selectObjects']> = [];
      while (statement.step()) {
        rows.push(statement.get({}));
      }
      statement.reset();
      const t1 = performance.now();
      if (debug) {
        console.log(
          `DbFacade.selectObjects — sql=${sql} took ${(t1 - t0).toFixed(
            3,
          )} ms; rows=${rows.length}`,
        );
      }

      return z.array(schema).parse(rows);
    },

    prepare: ({ sql }) => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      const t1 = performance.now();
      if (debug) {
        console.log(
          `DbFacade.prepare — sql=${sql} took ${(t1 - t0).toFixed(3)} ms`,
        );
      }
      return statement;
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
