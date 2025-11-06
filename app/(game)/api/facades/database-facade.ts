/** biome-ignore-all lint/suspicious/noConsole: We're using debug statements to test query performance in development */
import type { Database } from 'app/interfaces/db';

const createPreparedStatementCache = (): Map<
  string,
  ReturnType<Database['prepare']>
> => {
  return new Map<string, ReturnType<Database['prepare']>>([]);
};

export type DbFacade = {
  exec: (sql: string, bind?: Parameters<Database['selectValue']>[1]) => void;
  selectValue: (
    sql: string,
    bind?: Parameters<Database['selectValue']>[1],
  ) => ReturnType<Database['selectValue']>;
  selectValues: (
    sql: string,
    bind?: Parameters<Database['selectValues']>[1],
  ) => ReturnType<Database['selectValues']>;
  selectObject: (
    sql: string,
    bind?: Parameters<Database['selectObject']>[1],
  ) => ReturnType<Database['selectObject']>;
  selectObjects: (
    sql: string,
    bind?: Parameters<Database['selectObjects']>[1],
  ) => ReturnType<Database['selectObjects']>;
  prepare: (sql: string) => ReturnType<Database['prepare']>;
  transaction: (callback: (db: DbFacade) => void) => void;
  close: () => void;
};

export const createDbFacade = (database: Database, debug = false): DbFacade => {
  const preparedStatementCache = createPreparedStatementCache();

  const getStatement = (sql: string): ReturnType<Database['prepare']> => {
    const statement = preparedStatementCache.get(sql);

    if (!statement) {
      const preparedStatement = database.prepare(sql);
      preparedStatementCache.set(sql, preparedStatement);

      return preparedStatement;
    }

    return statement;
  };

  const facade: DbFacade = {
    exec: (
      sql: string,
      bind?: Parameters<Database['selectValue']>[1],
    ): void => {
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

    selectValue: (
      sql: string,
      bind?: Parameters<Database['selectValue']>[1],
    ): ReturnType<Database['selectValue']> => {
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

      return row.at(0);
    },

    selectValues: (
      sql: string,
      bind?: Parameters<Database['selectValues']>[1],
    ): ReturnType<Database['selectValues']> => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      const isDataAvailable = statement.step();

      if (isDataAvailable) {
        const rows = statement.get([]);
        statement.reset();
        const t1 = performance.now();
        if (debug) {
          console.log(
            `DbFacade.selectValues — sql=${sql} took ${(t1 - t0).toFixed(
              3,
            )} ms; rows=${Array.isArray(rows) ? rows.length : 'unknown'}`,
          );
        }

        return rows;
      }

      statement.reset();
      const t1 = performance.now();
      if (debug) {
        console.log(
          `DbFacade.selectValues — sql=${sql} took ${(t1 - t0).toFixed(
            3,
          )} ms; rows=0`,
        );
      }

      return [];
    },

    selectObject: (
      sql: string,
      bind?: Parameters<Database['selectObject']>[1],
    ): ReturnType<Database['selectObject']> => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      const isDataAvailable = statement.step();

      if (isDataAvailable) {
        const rows = statement.get({});
        statement.reset();
        const t1 = performance.now();
        if (debug) {
          console.log(
            `DbFacade.selectObject — sql=${sql} took ${(t1 - t0).toFixed(
              3,
            )} ms; present=true`,
          );
        }

        return rows;
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

    selectObjects: (
      sql: string,
      bind?: Parameters<Database['selectObjects']>[1],
    ): ReturnType<Database['selectObjects']> => {
      const t0 = performance.now();
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      const rows: ReturnType<Database['selectObjects']> = [];
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

      return rows;
    },

    prepare: (sql: string): ReturnType<Database['prepare']> => {
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
