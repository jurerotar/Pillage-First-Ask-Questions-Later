import 'fake-indexeddb/auto';
import { CRYLITE_TABLE_NAMES, database } from 'database/database';
import { CryliteTableName } from 'interfaces/models/database/crylite-table';

describe('Database', () => {
  test('Database initializes', () => {
    expect(database).not.toBe(undefined);
  });

  describe('Check for table existence', () => {
    Array.from(CRYLITE_TABLE_NAMES).forEach((tableName: CryliteTableName) => {
      test(`Table "${tableName}" exists`, () => {
        const table = database[tableName];
        expect(table).not.toBe(undefined);
      });
    });
  });
});
