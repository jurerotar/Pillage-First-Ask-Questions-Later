import 'fake-indexeddb/auto';
import { TABLE_NAMES, database } from 'database/database';
import { TableName } from 'interfaces/models/database/table-name';

describe('Database', () => {
  test('Database initializes', () => {
    expect(database).not.toBe(undefined);
  });

  describe('Check for table existence', () => {
    Array.from(TABLE_NAMES).forEach((tableName: TableName) => {
      test(`Table "${tableName}" exists`, () => {
        const table = database[tableName];
        expect(table).not.toBe(undefined);
      });
    });
  });
});
