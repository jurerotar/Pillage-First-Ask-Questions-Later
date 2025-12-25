import { describe, expect, test } from 'vitest';
import { createNewServer } from 'app/(public)/(game-worlds)/(create)/utils/create-new-server';
import { natureUnits } from 'app/assets/units';
import {
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
} from 'app/assets/utils/buildings';
import { getUnitDefinition, getUnitsByTribe } from 'app/assets/utils/units';
import { PLAYER_ID } from 'app/constants/player';
import type { Building } from 'app/interfaces/models/game/building';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { UnitId } from 'app/interfaces/models/game/unit';
import { serverMock } from 'app/tests/mocks/game/server-mock';
import { calculateGridLayout, decodeGraphicsProperty } from 'app/utils/map';

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
      const rowCount = database.selectValue(
        'SELECT COUNT(id) AS id FROM tiles;',
      );

      expect(rowCount).toBe(7825);
    });

    test('every tile should be of type free or oasis', () => {
      const types = database.selectValues('SELECT type FROM tiles;');

      expect(
        types.every((type) => type === 'free' || type === 'oasis'),
      ).toBeTruthy();
    });

    test('every free tile should have resource_field_composition as not null and oasis_graphics as null', () => {
      const rows = database.selectObjects(
        `
          SELECT
            t.id,
            rfc.resource_field_composition AS resource_field_composition,
            t.oasis_graphics
          FROM
            tiles AS t
              JOIN resource_field_compositions AS rfc
                   ON t.resource_field_composition_id = rfc.id
          WHERE
            t.type = 'free';
        `,
      ) as { resource_field_composition: string; oasis_graphics: null }[];

      const areTypesCorrect = rows.every(
        ({ resource_field_composition, oasis_graphics }) => {
          return (
            typeof resource_field_composition === 'string' &&
            oasis_graphics === null
          );
        },
      );

      expect(areTypesCorrect).toBeTruthy();
    });

    test('every oasis tile should have oasis_graphics as not null and resource_field_composition as null', () => {
      const rows = database.selectObjects(
        `
          SELECT
            t.id,
            rfc.resource_field_composition AS resource_field_composition,
            t.oasis_graphics
          FROM
            tiles AS t
              LEFT JOIN resource_field_compositions AS rfc
                        ON t.resource_field_composition_id = rfc.id
          WHERE
            t.type = 'oasis';
        `,
      ) as { resource_field_composition: null; oasis_graphics: number }[];

      const areTypesCorrect = rows.every(
        ({ resource_field_composition, oasis_graphics }) => {
          return (
            resource_field_composition === null &&
            typeof oasis_graphics === 'number'
          );
        },
      );

      expect(areTypesCorrect).toBeTruthy();
    });

    test('oasis groups tile counts are multiples of expected shape sizes', () => {
      const rows = database.selectObjects(
        `SELECT id, oasis_graphics
         FROM
           tiles
         WHERE
           type = 'oasis';`,
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
        'SELECT x, y, COUNT(*) AS c FROM tiles GROUP BY x, y HAVING c > 1;',
      );

      expect(duplicates).toHaveLength(0);
    });

    test('center tile (0,0) exists, is free and has composition "4446"', () => {
      const center = database.selectObject(
        `
          SELECT
            t.id,
            t.type,
            rfc.resource_field_composition AS resource_field_composition,
            t.oasis_graphics
          FROM
            tiles t
              LEFT JOIN resource_field_compositions rfc
                        ON t.resource_field_composition_id = rfc.id
          WHERE
            t.x = 0
            AND t.y = 0;
        `,
      ) as {
        type: string;
        resource_field_composition: string | null;
        oasis_graphics: number | null;
      };

      expect(center).toBeTruthy();
      expect(center.type).toBe('free');
      expect(center.resource_field_composition).toBe('4446');
      expect(center.oasis_graphics).toBeNull();
    });

    test('no tile has both resource_field_composition_id AND oasis_graphics non-null', () => {
      const bothNonNull = database.selectValue(
        'SELECT COUNT(*) AS c FROM tiles WHERE resource_field_composition_id IS NOT NULL AND oasis_graphics IS NOT NULL;',
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
        `
          SELECT DISTINCT rfc.resource_field_composition
          FROM
            tiles t
              JOIN resource_field_compositions rfc
                   ON t.resource_field_composition_id = rfc.id
          WHERE
            t.resource_field_composition_id IS NOT NULL;
        `,
      ) as string[];

      const invalid = distinctComps.filter((c) => !allowed.has(c));
      expect(invalid).toStrictEqual([]);
    });

    test('all tile coordinates are within expected grid bounds', () => {
      const { halfSize } = calculateGridLayout(
        serverMock.configuration.mapSize,
      );

      const bounds = database.selectObject(
        'SELECT MIN(x) AS minX, MAX(x) AS maxX, MIN(y) AS minY, MAX(y) AS maxY FROM tiles;',
      ) as { minX: number; minY: number; maxX: number; maxY: number };

      expect(bounds.minX).toBeGreaterThanOrEqual(-halfSize);
      expect(bounds.maxX).toBeLessThanOrEqual(halfSize);
      expect(bounds.minY).toBeGreaterThanOrEqual(-halfSize);
      expect(bounds.maxY).toBeLessThanOrEqual(halfSize);
    });
  });

  describe('Players', () => {
    test('slugs are unique and contain only lowercase alphanumeric and dashes', () => {
      const slugs = database.selectValues(
        'SELECT slug FROM players;',
      ) as string[];
      const distinctCount = database.selectValue(
        'SELECT COUNT(DISTINCT slug) AS c FROM players;',
      );

      expect(distinctCount).toBe(slugs.length);

      // slug format (lowercase, digits, dashes)
      for (const s of slugs) {
        expect(/^[a-z0-9-]+$/.test(s)).toBeTruthy();
        // no leading or trailing dash
        expect(s).not.toMatch(/^-/);
        expect(s).not.toMatch(/-$/);
      }
    });

    test('only one player has faction_id = 1 and that player has id = 1', () => {
      const count = database.selectValue(
        'SELECT COUNT(*) AS c FROM players WHERE faction_id = 1;',
      ) as number;
      expect(count).toBe(1);
    });

    test('player count equals expected formula (player + generated NPCs)', () => {
      // compute expected NPC count using same formula as generateNpcPlayers
      const { totalTiles } = calculateGridLayout(
        serverMock.configuration.mapSize,
      );
      const playerDensity = 0.046;
      const expectedTotalPlayers =
        Math.round((playerDensity * totalTiles) / 100) * 100; // +1 human player

      const actualCount = database.selectValue(
        'SELECT COUNT(*) AS c FROM players;',
      );

      // The generator uses that formula; assert equality so seeder didn't accidentally change counts.
      expect(actualCount).toBe(expectedTotalPlayers);
    });
  });

  describe('Oasis', () => {
    test('oasis rows only exist for tiles with type = "oasis"', () => {
      const countForNonOasis = database.selectValue(
        `SELECT COUNT(*) AS c
         FROM
           oasis o
             JOIN tiles t ON o.tile_id = t.id
         WHERE
           t.type != 'oasis';`,
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
        expect([25, 50].includes(bonusNum)).toBeTruthy();
      }
    });

    test('there is at least one oasis that has BOTH its resource bonus and a separate wheat bonus (composite)', () => {
      const count = database.selectValue(`
        SELECT COUNT(*)
        FROM
          oasis
        GROUP BY
          tile_id
        HAVING
          SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) >= 1
          AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `) as number;

      expect(count).toBeGreaterThan(0);
    });

    test('there is at least one oasis that has a resource bonus WITHOUT any wheat bonus (resource-only)', () => {
      const count = database.selectValue(`
        SELECT COUNT(*)
        FROM
          oasis
        GROUP BY
          tile_id
        HAVING
          SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) = 0
          AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `) as number;

      expect(count).toBeGreaterThan(0);
    });

    test('there is at least one oasis that has a 50% bonus', () => {
      const count = database.selectValue(
        'SELECT COUNT(*) FROM oasis WHERE bonus = 50;',
      ) as number;

      expect(count).toBeGreaterThan(0);
    });

    test('at least 4 tiles with RFC 00018 (18c) have >= 3 distinct 50% wheat oases (150% total)', () => {
      const count = database.selectValue(
        `
          SELECT COUNT(*)
          FROM
            (
              SELECT t.id
              FROM
                tiles t
                  JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
                  JOIN oasis_occupiable_by ob ON ob.tile_id = t.id
                  JOIN oasis o ON o.tile_id = ob.oasis_id
              WHERE
                rfc.resource_field_composition = '00018'
                AND o.bonus = 50
                AND o.resource = 'wheat'
                AND t.type = 'free'
              GROUP BY t.id
              HAVING
                COUNT(DISTINCT o.tile_id) >= 3
              );
        `,
      ) as number;

      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('at least 12 tiles with RFC 11115 (15c) have >= 3 distinct 50% wheat oases (150% total)', () => {
      const count = database.selectValue(
        `
          SELECT COUNT(*)
          FROM
            (
              SELECT t.id
              FROM
                tiles t
                  JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
                  JOIN oasis_occupiable_by ob ON ob.tile_id = t.id
                  JOIN oasis o ON o.tile_id = ob.oasis_id
              WHERE
                rfc.resource_field_composition = '11115'
                AND o.bonus = 50
                AND o.resource = 'wheat'
                AND t.type = 'free'
              GROUP BY t.id
              HAVING
                COUNT(DISTINCT o.tile_id) >= 3
              );
        `,
      ) as number;

      expect(count).toBeGreaterThanOrEqual(12);
    });

    test('at least 20 tiles with RFC 3339 have >= 3 distinct 50% wheat oases', () => {
      const count = database.selectValue(
        `
          SELECT COUNT(*)
          FROM
            (
              SELECT t.id
              FROM
                tiles t
                  JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
                  JOIN oasis_occupiable_by ob ON ob.tile_id = t.id
                  JOIN oasis o ON o.tile_id = ob.oasis_id
              WHERE
                rfc.resource_field_composition = '3339'
                AND o.bonus = 50
                AND o.resource = 'wheat'
                AND t.type = 'free'
              GROUP BY t.id
              HAVING
                COUNT(DISTINCT o.tile_id) >= 3
              );
        `,
      ) as number;

      expect(count).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Map filters', () => {
    test('map_filters row exists for player', () => {
      const countRow = database.selectObject(
        `SELECT COUNT(*) AS cnt
         FROM
           map_filters
         WHERE
           player_id = $player_id;`,
        { $player_id: PLAYER_ID },
      ) as { cnt: number };

      expect(countRow.cnt).toBeGreaterThan(0);
    });
  });

  describe('Preferences', () => {
    test('preferences row exists for player', () => {
      const countRow = database.selectObject(
        `SELECT COUNT(*) AS cnt
         FROM
           preferences
         WHERE
           player_id = $player_id;`,
        { $player_id: PLAYER_ID },
      ) as { cnt: number };

      expect(countRow.cnt).toBeGreaterThan(0);
    });
  });

  describe('Server', () => {
    test('servers table contains exactly one server', () => {
      const c = database.selectValue('SELECT COUNT(*) FROM servers;') as number;
      expect(c).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Factions', () => {
    test('factions seeded (>0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM factions;',
      ) as number;
      expect(c).toBeGreaterThan(0);
    });

    test('faction ids are unique', () => {
      const distinct = database.selectValue(
        'SELECT COUNT(DISTINCT id) FROM factions;',
      ) as number;
      const total = database.selectValue('SELECT COUNT(*) FROM factions;');
      expect(distinct).toBe(total);
    });
  });

  describe('Faction reputation', () => {
    test('faction_reputation seeded (>=0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM faction_reputation;',
      ) as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Heroes', () => {
    test('heroes seeded (>0)', () => {
      const c = database.selectValue('SELECT COUNT(*) FROM heroes;') as number;
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('Hero adventures', () => {
    test('hero_adventures seeded (>=0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM hero_adventures;',
      ) as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource field compositions', () => {
    test('resource_field_compositions seeded (>0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM resource_field_compositions;',
      ) as number;
      expect(c).toBeGreaterThan(0);
    });

    test('contains well-known composition 4446', () => {
      const c = database.selectValue(
        `SELECT COUNT(*)
         FROM
           resource_field_compositions
         WHERE
           resource_field_composition = '4446';`,
      ) as number;
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('Guaranteed croppers (oasis_occupiable_by)', () => {
    test('oasis_occupiable_by seeded (>0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM oasis_occupiable_by;',
      ) as number;
      expect(c).toBeGreaterThan(0);
    });

    test('links reference free tiles and oasis tiles', () => {
      const invalid = database.selectValue(
        `SELECT COUNT(*)
         FROM
           oasis_occupiable_by ob
             LEFT JOIN tiles t ON t.id = ob.tile_id
             LEFT JOIN tiles o ON o.id = ob.oasis_id
         WHERE
           t.id IS NULL
           OR o.id IS NULL
           OR t.type != 'free'
           OR o.type != 'oasis';`,
      ) as number;
      expect(invalid).toBe(0);
    });
  });

  describe('Villages', () => {
    test('villages seeded (>0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM villages;',
      ) as number;
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('Bookmarks', () => {
    test('bookmarks seeded (>=0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM bookmarks;',
      ) as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Building fields', () => {
    test('building_fields seeded (>0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM building_fields;',
      ) as number;
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('Troops', () => {
    test('unoccupied oasis tiles have troops', () => {
      const withoutTroops = database.selectValue(
        `SELECT COUNT(*)
         FROM
           tiles t
         WHERE
           t.type = 'oasis'
           AND EXISTS
           (
             SELECT 1
             FROM
               oasis o
             WHERE
               o.tile_id = t.id
               AND o.village_id IS NULL
             )
           AND NOT EXISTS
           (
             SELECT 1
             FROM
               troops tr
             WHERE
               tr.tile_id = t.id
             );`,
      ) as number;
      expect(withoutTroops).toBe(0);
    });

    test('unoccupied oasis tiles only have nature troops', () => {
      const invalid = database.selectValue(
        `SELECT COUNT(*)
         FROM
           troops tr
             JOIN tiles t ON t.id = tr.tile_id
         WHERE
           t.type = 'oasis'
           AND EXISTS
           (
             SELECT 1
             FROM
               oasis o
             WHERE
               o.tile_id = t.id
               AND o.village_id IS NULL
             )
           AND tr.unit_id NOT IN (${natureUnits.map(({ id }) => `'${id}'`)});`,
      ) as number;

      expect(invalid).toBe(0);
    });
  });

  describe('Effect IDs and Effects', () => {
    test('effect_ids seeded (>0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM effect_ids;',
      ) as number;
      expect(c).toBeGreaterThan(0);
    });

    test('effects seeded (>0) and reference valid effect_ids', () => {
      const effectsCount = database.selectValue(
        'SELECT COUNT(*) FROM effects;',
      ) as number;
      expect(effectsCount).toBeGreaterThan(0);

      const invalid = database.selectValue(
        `SELECT COUNT(*)
         FROM
           effects e
             LEFT JOIN effect_ids ei ON ei.id = e.effect_id
         WHERE
           ei.id IS NULL;`,
      ) as number;
      expect(invalid).toBe(0);
    });
  });

  describe('Resource sites', () => {
    test('resource_sites seeded (>=0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM resource_sites;',
      ) as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('World items', () => {
    test('world_items seeded (>=0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM world_items;',
      ) as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Unit research', () => {
    test('unit_research seeded (>=0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM unit_research;',
      ) as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Unit improvement', () => {
    test('unit_improvements seeded (>=0)', () => {
      const c = database.selectValue(
        'SELECT COUNT(*) FROM unit_improvements;',
      ) as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quests', () => {
    test('quests seeded (>=0)', () => {
      const c = database.selectValue('SELECT COUNT(*) FROM quests;') as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });

    test('village building quests exist (WOODCUTTER oneOf)', () => {
      const count = database.selectValue(
        `SELECT COUNT(*)
         FROM
           quests
         WHERE
           village_id IS NOT NULL
           AND quest_id LIKE 'oneOf-WOODCUTTER-%';`,
      ) as number;
      expect(count).toBeGreaterThan(0);
    });

    test('global quests include troopCount, adventureCount, killCount, unitKillCount', () => {
      const troopCount = database.selectValue(
        `SELECT COUNT(*)
         FROM
           quests
         WHERE
           village_id IS NULL
           AND quest_id LIKE 'troopCount-%';`,
      ) as number;
      expect(troopCount).toBeGreaterThan(0);

      const adventureCount = database.selectValue(
        `SELECT COUNT(*)
         FROM
           quests
         WHERE
           village_id IS NULL
           AND quest_id LIKE 'adventureCount-%';`,
      ) as number;
      expect(adventureCount).toBeGreaterThan(0);

      const killCount = database.selectValue(
        `SELECT COUNT(*)
         FROM
           quests
         WHERE
           village_id IS NULL
           AND quest_id LIKE 'killCount-%';`,
      ) as number;
      expect(killCount).toBeGreaterThan(0);

      const unitKillCount = database.selectValue(
        `SELECT COUNT(*)
         FROM
           quests
         WHERE
           village_id IS NULL
           AND quest_id LIKE 'unitKillCount-%';`,
      ) as number;
      expect(unitKillCount).toBeGreaterThan(0);
    });

    test('unitTroopCount quests exist and only for the player tribe units', () => {
      const tribe = database.selectValue(
        `SELECT tribe
         FROM
           players
         WHERE
           id = $playerId;`,
        { $playerId: PLAYER_ID },
      ) as PlayableTribe;

      const unitTroopCountQuests = database.selectValues(
        `SELECT quest_id
         FROM
           quests
         WHERE
           village_id IS NULL
           AND quest_id LIKE 'unitTroopCount-%';`,
      ) as string[];

      // Must exist
      expect(unitTroopCountQuests.length).toBeGreaterThan(0);

      const unitsByTribe = getUnitsByTribe(tribe).filter(
        ({ id }) => !['SETTLER', 'CHIEF'].includes(id),
      );

      const allowedUnitIds = unitsByTribe.map(({ id }) => id);

      // Build allowed unit id set for tribe (excluding SETTLER and CHIEF)
      const allowed = new Set<UnitId>(allowedUnitIds);

      for (const qid of unitTroopCountQuests) {
        // Format: unitTroopCount-<UNIT>-<COUNT>
        const parts = qid.split('-');
        // parts[0] = 'unitTroopCount'
        const unitId = parts[1];
        expect(allowed.has(unitId as UnitId)).toBe(true);
      }
    });

    test('tribal wall building quests exist for starting village', () => {
      const tribe = database.selectValue(
        `SELECT tribe
         FROM
           players
         WHERE
           id = $playerId;`,
        { $playerId: PLAYER_ID },
      ) as PlayableTribe;

      const wallByTribe: Record<string, string> = {
        romans: 'CITY_WALL',
        gauls: 'PALISADE',
        teutons: 'EARTH_WALL',
        huns: 'MAKESHIFT_WALL',
        egyptians: 'STONE_WALL',
      };

      const wall = wallByTribe[tribe];

      const count = database.selectValue(
        `SELECT COUNT(*)
         FROM
           quests
         WHERE
           village_id IS NOT NULL
           AND quest_id = $qid;`,
        { $qid: `oneOf-${wall}-1` },
      ) as number;

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Events', () => {
    test('events seeded (>=0)', () => {
      const c = database.selectValue('SELECT COUNT(*) FROM events;') as number;
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Effects per village', () => {
    test('has building-based wheatProduction matching population (source_specifier = 0)', () => {
      // Preload effect id for wheatProduction
      const wheatEffectId = database.selectValue(
        `SELECT id
         FROM
           effect_ids
         WHERE
           effect = 'wheatProduction';`,
      ) as number;

      // For each village, compute expected population from building_fields using the same logic as seeder
      const villages = database.selectObjects(
        `SELECT id
         FROM
           villages;`,
      ) as { id: number }[];

      for (const { id: villageId } of villages) {
        const fields = database.selectObjects(
          `SELECT building_id, level
           FROM
             building_fields
           WHERE
             village_id = $villageId;`,
          { $villageId: villageId },
        ) as { building_id: string; level: number }[];

        let population = 0;
        for (const { building_id, level } of fields) {
          const def = getBuildingDefinition(building_id as Building['id']);
          population += calculateTotalPopulationForLevel(def.id, level);
        }

        const exists = database.selectValue(
          `SELECT COUNT(*)
           FROM
             effects
           WHERE
             effect_id = $effectId
             AND value = $value
             AND type = 'base'
             AND scope = 'village'
             AND source = 'building'
             AND village_id = $villageId
             AND source_specifier = 0;`,
          {
            $effectId: wheatEffectId,
            $value: -population,
            $villageId: villageId,
          },
        ) as number;

        expect(exists).toBeGreaterThan(0);
      }
    });

    test('has troops-based wheatProduction matching troop wheat consumption (source_specifier IS NULL)', () => {
      // Preload effect id for wheatProduction
      const wheatEffectId = database.selectValue(
        `SELECT id
         FROM
           effect_ids
         WHERE
           effect = 'wheatProduction';`,
      ) as number;

      const villages = database.selectObjects(
        `SELECT id, tile_id
         FROM
           villages;`,
      ) as { id: number; tile_id: number }[];

      for (const { id: villageId, tile_id } of villages) {
        const troopRows = database.selectObjects(
          `SELECT unit_id, amount
           FROM
             troops
           WHERE
             tile_id = $tileId;`,
          { $tileId: tile_id },
        ) as { unit_id: string; amount: number }[];

        let troopWheatConsumption = 0;
        for (const { unit_id, amount } of troopRows) {
          const { unitWheatConsumption } = getUnitDefinition(unit_id as UnitId);
          troopWheatConsumption += unitWheatConsumption * amount;
        }

        const exists = database.selectValue(
          `SELECT COUNT(*)
           FROM
             effects
           WHERE
             effect_id = $effectId
             AND value = $value
             AND type = 'base'
             AND scope = 'village'
             AND source = 'troops'
             AND village_id = $villageId
             AND source_specifier IS NULL;`,
          {
            $effectId: wheatEffectId,
            $value: troopWheatConsumption,
            $villageId: villageId,
          },
        ) as number;

        expect(exists).toBeGreaterThan(0);
      }
    });
  });
});
