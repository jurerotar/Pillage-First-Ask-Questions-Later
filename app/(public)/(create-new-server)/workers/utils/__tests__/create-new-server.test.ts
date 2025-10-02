import { describe, test, expect } from 'vitest';
import { createNewServer } from 'app/(public)/(create-new-server)/workers/utils/create-new-server';
import { serverMock } from 'app/tests/mocks/game/server-mock';
import { calculateGridLayout, decodeGraphicsProperty } from 'app/utils/map';
import { PLAYER_ID } from 'app/constants/player';

const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');
const sqlite3 = await sqlite3InitModule();

const database = new sqlite3.oo1.DB(':memory:', 'c');

// Since this only runs in test environment, we can select best performance settings
database.exec(`
  PRAGMA page_size = 8192;          -- set before creating tables (optional)
  PRAGMA locking_mode = EXCLUSIVE;  -- avoid file locks
  PRAGMA journal_mode = OFF;        -- no rollback journal
  PRAGMA synchronous = OFF;         -- don't wait on disk
  PRAGMA foreign_keys = OFF;        -- skip FK checks
  PRAGMA temp_store = MEMORY;       -- temp tables in RAM
  PRAGMA cache_size = -200000;      -- negative = KB, here ~200MB cache
  PRAGMA secure_delete = OFF;       -- don't wipe deleted content
`);

createNewServer(database, serverMock);

describe('createNewServer', () => {
  describe('Tiles', () => {
    test('should create correct amount of tiles', () => {
      const { totalTiles } = calculateGridLayout(
        serverMock.configuration.mapSize,
      );
      const rowCount = database.selectValue(
        'SELECT count(id) as id FROM tiles;',
      );

      expect(rowCount).toBe(totalTiles);
    });

    test('every tile should be of type free or oasis', () => {
      const types = database.selectValues('SELECT type FROM tiles;');

      expect(types.every((type) => type === 'free' || type === 'oasis')).toBe(
        true,
      );
    });

    test('every free tile should have resource_field_composition as not null and oasis_graphics as null', () => {
      const rows = database.selectObjects(
        `SELECT id, resource_field_composition, oasis_graphics
         FROM tiles
         WHERE type = 'free';`,
      ) as { resource_field_composition: string; oasis_graphics: null }[];

      const areTypesCorrect = rows.every(
        ({ resource_field_composition, oasis_graphics }) => {
          return (
            typeof resource_field_composition === 'string' &&
            oasis_graphics === null
          );
        },
      );

      expect(areTypesCorrect).toBe(true);
    });

    test('every oasis tile should have oasis_graphics as not null and resource_field_composition as null', () => {
      const rows = database.selectObjects(
        `SELECT id, resource_field_composition, oasis_graphics
         FROM tiles
         WHERE type = 'oasis';`,
      ) as { resource_field_composition: null; oasis_graphics: number }[];

      const areTypesCorrect = rows.every(
        ({ resource_field_composition, oasis_graphics }) => {
          return (
            resource_field_composition === null &&
            typeof oasis_graphics === 'number'
          );
        },
      );

      expect(areTypesCorrect).toBe(true);
    });

    test('oasis groups tile counts are multiples of expected shape sizes', () => {
      const rows = database.selectObjects(
        `SELECT id, oasis_graphics
         FROM tiles
         WHERE type = 'oasis';`,
      ) as { id: number; oasis_graphics: number }[];

      const counts = new Map<number, number>();

      for (const { oasis_graphics } of rows) {
        const { oasisGroup } = decodeGraphicsProperty(oasis_graphics);
        counts.set(oasisGroup, (counts.get(oasisGroup) ?? 0) + 1);
      }

      const expectedTilesByGroup: Record<number, number> = {
        1: 2,
        2: 4,
        3: 3,
        4: 3,
      };

      for (const [groupStr, expectedTiles] of Object.entries(
        expectedTilesByGroup,
      )) {
        const group = Number(groupStr);
        const count = counts.get(group) ?? 0;
        // If count is zero we still check divisibility (0 % n === 0) — adjust if you want to require >0
        expect(count % expectedTiles).toBe(0);
      }
    });

    test('no duplicate coordinates (x,y)', () => {
      const duplicates = database.selectObjects(
        'SELECT x, y, COUNT(*) as c FROM tiles GROUP BY x, y HAVING c > 1;',
      );

      expect(duplicates.length).toBe(0);
    });

    test('center tile (0,0) exists, is free and has composition "4446"', () => {
      const center = database.selectObject(
        'SELECT id, type, resource_field_composition, oasis_graphics FROM tiles WHERE x = 0 AND y = 0;',
      ) as {
        type: string;
        resource_field_composition: string;
        oasis_graphics: null;
      };

      expect(center).toBeTruthy();
      expect(center.type).toBe('free');
      expect(center.resource_field_composition).toBe('4446');
      expect(center.oasis_graphics).toBeNull();
    });

    test('no tile has both resource_field_composition AND oasis_graphics non-null', () => {
      const bothNonNull = database.selectValue(
        'SELECT count(*) as c FROM tiles WHERE resource_field_composition IS NOT NULL AND oasis_graphics IS NOT NULL;',
      );

      expect(bothNonNull).toBe(0);
    });

    test('all non-null resource_field_composition values belong to allowed set', () => {
      const allowed = new Set([
        '00018',
        '11115',
        '3339',
        '4437',
        '4347',
        '3447',
        '3456',
        '4356',
        '3546',
        '4536',
        '5346',
        '5436',
        '4446',
      ]);

      const distinctComps = database.selectValues(
        'SELECT DISTINCT resource_field_composition FROM tiles WHERE resource_field_composition IS NOT NULL;',
      ) as string[];

      const invalid = distinctComps.filter((c) => !allowed.has(c));
      expect(invalid).toEqual([]);
    });

    test('all tile coordinates are within expected grid bounds', () => {
      const { halfSize } = calculateGridLayout(
        serverMock.configuration.mapSize,
      );

      const bounds = database.selectObject(
        'SELECT min(x) as minX, max(x) as maxX, min(y) as minY, max(y) as maxY FROM tiles;',
      ) as { minX: number; minY: number; maxX: number; maxY: number };

      expect(bounds.minX).toBeGreaterThanOrEqual(-halfSize);
      expect(bounds.maxX).toBeLessThanOrEqual(halfSize);
      expect(bounds.minY).toBeGreaterThanOrEqual(-halfSize);
      expect(bounds.maxY).toBeLessThanOrEqual(halfSize);
    });
  });

  describe('Players', () => {
    test('inserts players and DB column types are correct', () => {
      const rows = database.selectObjects(
        'SELECT id, name, slug, tribe, faction_id FROM players;',
      ) as {
        id: number;
        name: string;
        slug: string;
        tribe: string;
        faction_id: string;
      }[];

      const allowedTribes = new Set([
        'romans',
        'gauls',
        'teutons',
        'huns',
        'egyptians',
      ]);

      for (const row of rows) {
        expect(typeof row.name).toBe('string');
        expect(typeof row.slug).toBe('string');
        expect(allowedTribes.has(row.tribe as string)).toBe(true);
        expect(row.faction_id.length).toBeGreaterThan(0);
      }
    });

    test('slugs are unique and contain only lowercase alphanumeric and dashes', () => {
      const slugs = database.selectValues(
        'SELECT slug FROM players;',
      ) as string[];
      const distinctCount = database.selectValue(
        'SELECT count(DISTINCT slug) as c FROM players;',
      );

      expect(distinctCount).toBe(slugs.length);

      // slug format (lowercase, digits, dashes)
      for (const s of slugs) {
        expect(/^[a-z0-9-]+$/.test(s)).toBe(true);
        // no leading or trailing dash
        expect(s).not.toMatch(/^-/);
        expect(s).not.toMatch(/-$/);
      }
    });

    test('player count equals expected formula (player + generated NPCs)', () => {
      // compute expected NPC count using same formula as generateNpcPlayers
      const { totalTiles } = calculateGridLayout(
        serverMock.configuration.mapSize,
      );
      const playerDensity = 0.046;
      const expectedNpcCount =
        Math.round((playerDensity * totalTiles) / 100) * 100;
      const expectedTotalPlayers = expectedNpcCount + 1; // +1 human player

      const actualCount = database.selectValue(
        'SELECT count(*) as c FROM players;',
      );

      // The generator uses that formula; assert equality so seeder didn't accidentally change counts.
      expect(actualCount).toBe(expectedTotalPlayers);
    });
  });

  describe('Oasis', () => {
    test('oasis rows only exist for tiles with type = "oasis"', () => {
      const countForNonOasis = database.selectValue(
        `SELECT count(*) as c
         FROM oasis o
                JOIN tiles t ON o.tile_id = t.id
         WHERE t.type != 'oasis';`,
      );
      expect(countForNonOasis).toBe(0);
    });

    test('oasis bonus values are only 25 or 50 and resource strings are lowercase', () => {
      const rows = database.selectObjects(
        'SELECT resource, bonus FROM oasis;',
      ) as {
        resource: string;
        bonus: number;
      }[];

      for (const r of rows) {
        expect(typeof r.resource).toBe('string');
        expect(r.resource).toBe(r.resource?.toLowerCase());
        const bonusNum = Number(r.bonus);
        expect([25, 50].includes(bonusNum)).toBe(true);
      }
    });

    test('there is at least one oasis that has BOTH its resource bonus and a separate wheat bonus (composite)', () => {
      const count = database.selectValue(`
        SELECT COUNT(*)
        FROM oasis
        GROUP BY tile_id
        HAVING SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) >= 1
           AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `) as number;

      expect(count).toBeGreaterThan(0);
    });

    test('there is at least one oasis that has a resource bonus WITHOUT any wheat bonus (resource-only)', () => {
      const count = database.selectValue(`
        SELECT COUNT(*)
        FROM oasis
        GROUP BY tile_id
        HAVING SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) = 0
           AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `) as number;

      expect(count).toBeGreaterThan(0);
    });

    test('there is at least one oasis that has a 50% bonus', () => {
      const count = database.selectValue(
        'SELECT count(*) FROM oasis WHERE bonus = 50;',
      ) as number;

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Map filters', () => {
    test('map_filters row exists for player', () => {
      const countRow = database.selectObject(
        `SELECT COUNT(*) as cnt
         FROM map_filters
         WHERE player_id = $player_id;`,
        { $player_id: PLAYER_ID },
      ) as { cnt: number };

      expect(countRow.cnt).toBeGreaterThan(0);
    });
  });

  describe('Preferences', () => {
    test('preferences row exists for player', () => {
      const countRow = database.selectObject(
        `SELECT COUNT(*) as cnt
         FROM preferences
         WHERE player_id = $player_id;`,
        { $player_id: PLAYER_ID },
      ) as { cnt: number };

      expect(countRow.cnt).toBeGreaterThan(0);
    });
  });
});
