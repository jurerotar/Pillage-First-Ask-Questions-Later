import "fake-indexeddb/auto";
import { database } from 'database/database';

describe('Database', () => {
  test('Database initializes', () => {
    expect(database).not.toBe(undefined);
  });

  // TODO: Currently only testing initialization, it should be expanded to test indexes as well
  describe('Tables', () => {
    describe('servers', () => {
      const table = database.servers;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('maps', () => {
      const table = database.maps;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('heroes', () => {
      const table = database.heroes;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('villages', () => {
      const table = database.villages;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('reports', () => {
      const table = database.reports;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('quests', () => {
      const table = database.quests;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('achievements', () => {
      const table = database.achievements;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('events', () => {
      const table = database.events;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('effects', () => {
      const table = database.effects;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('banks', () => {
      const table = database.banks;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });

    describe('researchLevels', () => {
      const table = database.researchLevels;

      test('Exists', () => {
        expect(table).not.toBe(undefined);
      });
    });
  });
});
