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
};

export const createDbFacade = (database: Database): DbFacade => {
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
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      statement.reset();
    },

    selectValue: (
      sql: string,
      bind?: Parameters<Database['selectValue']>[1],
    ): ReturnType<Database['selectValue']> => {
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      statement.step();
      const row = statement.get([]);
      statement.reset();

      return row.at(0);
    },

    selectValues: (
      sql: string,
      bind?: Parameters<Database['selectValues']>[1],
    ): ReturnType<Database['selectValues']> => {
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      statement.step();
      const rows = statement.get([]);
      statement.reset();

      return rows;
    },

    selectObject: (
      sql: string,
      bind?: Parameters<Database['selectObject']>[1],
    ): ReturnType<Database['selectObject']> => {
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      statement.step();
      const row = statement.get({});
      statement.reset();

      return row;
    },

    selectObjects: (
      sql: string,
      bind?: Parameters<Database['selectObjects']>[1],
    ): ReturnType<Database['selectObjects']> => {
      const statement = getStatement(sql);
      if (bind) {
        statement.bind(bind);
      }
      const rows: ReturnType<Database['selectObjects']> = [];
      while (statement.step()) {
        rows.push(statement.get({}));
      }
      statement.reset();

      return rows;
    },

    prepare: (sql: string): ReturnType<Database['prepare']> => {
      const statement = getStatement(sql);
      return statement;
    },

    transaction: (callback: (db: DbFacade) => void): void => {
      database.transaction(() => {
        callback(facade);
      });
    },
  };

  return facade;
};
