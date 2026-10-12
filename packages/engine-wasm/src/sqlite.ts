import type { OpfsSAHPoolDatabase } from '@sqlite.org/sqlite-wasm';
import { createDbFacade } from '@pillage-first/utils/facades/database';
import { notificationCheckpoint, rollbackNotifications } from './notifications';

const check = (code: number): void => {
  if (code !== 0) {
    throw new Error(`SQLite ${code}: ${engineNative.error()}`);
  }
};

export const openDatabase = (path: string) => {
  check(engineNative.open(path));
  const raw = {
    prepare(sql: string) {
      let id = engineNative.prepare(sql);
      if (!id) {
        throw new Error(engineNative.error());
      }
      // Statement metadata belongs to the adapter; the shared facade is unchanged.
      const parameterIndexes = Object.create(null) as Record<string, number>;
      const columnNames: string[] = [];
      let clean = true;
      const bindValue = (index: number, value: unknown) => {
        clean = false;
        if (value === null || value === undefined) {
          check(engineNative.bindNull(id, index));
        } else if (typeof value === 'number') {
          check(engineNative.bindNumber(id, index, value));
        } else if (typeof value === 'string') {
          check(engineNative.bindText(id, index, value));
        } else if (value instanceof Uint8Array) {
          check(engineNative.bindBlob(id, index, value));
        } else {
          throw new Error(`Unsupported SQL value for parameter ${index}`);
        }
      };
      const value = (col: number) => {
        switch (engineNative.columnType(id, col)) {
          case 1:
          case 2:
            return engineNative.columnNumber(id, col);
          case 3:
            return engineNative.columnText(id, col);
          case 4:
            return engineNative.columnBlob(id, col);
          default:
            return null;
        }
      };
      const statement = {
        reset(clear = false) {
          if (clear && clean) {
            return statement;
          }
          check(engineNative.reset(id, clear ? 1 : 0));
          clean = clear;
          return statement;
        },
        bind(values: unknown[] | Record<string, unknown>) {
          const array = Array.isArray(values);
          for (const key of Object.keys(values)) {
            const value = (values as Record<string, unknown>)[key];
            const index = array
              ? Number(key) + 1
              : (parameterIndexes[key] ??
                (() => {
                  const index = engineNative.parameter(id, key);
                  parameterIndexes[key] = index;
                  return index;
                })());
            if (!index) {
              throw new Error(`Unknown SQL parameter ${key}`);
            }
            bindValue(index, value);
          }
          return statement;
        },
        step() {
          clean = false;
          const code = engineNative.step(id);
          if (code === 100) {
            return true;
          }
          if (code === 101) {
            return false;
          }
          check(code);
          return false;
        },
        stepReset() {
          statement.step();
          statement.reset();
          return statement;
        },
        get(target: number | Record<string, unknown>) {
          if (typeof target === 'number') {
            return value(target);
          }
          const columnCount = engineNative.columns(id);
          for (let col = 0; col < columnCount; col++) {
            const name = columnNames[col] ?? engineNative.columnName(id, col);
            columnNames[col] = name;
            target[name] = value(col);
          }
          return target;
        },
        finalize() {
          const result = engineNative.finalize(id);
          // Finalize frees the handle even when it reports a prior step error.
          // A retained statement must never address an ID assigned to a new one.
          id = 0;
          clean = true;
          check(result);
        },
      };
      return statement;
    },
    exec({ sql, bind }: { sql: string; bind?: Record<string, unknown> }) {
      if (bind) {
        const statement = raw.prepare(sql);
        try {
          statement.bind(bind).step();
        } finally {
          statement.finalize();
        }
      } else {
        check(engineNative.exec(sql));
      }
    },
    transaction(callback: () => void) {
      const checkpoint = notificationCheckpoint();
      check(engineNative.transaction(0));
      try {
        callback();
        check(engineNative.transaction(1));
      } catch (error) {
        engineNative.transaction(2);
        rollbackNotifications(checkpoint);
        throw error;
      }
    },
  };
  check(engineNative.exec('PRAGMA foreign_keys=ON;'));
  return createDbFacade(raw as unknown as OpfsSAHPoolDatabase);
};
