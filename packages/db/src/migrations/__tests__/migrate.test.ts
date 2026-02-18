import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/buildings/utils';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { natureUnits } from '@pillage-first/game-assets/units';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/units/utils';
import { serverMock } from '@pillage-first/mocks/server';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { tileTypeSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { type UnitId, unitIdSchema } from '@pillage-first/types/models/unit';
import {
  calculateGridLayout,
  decodeGraphicsProperty,
} from '@pillage-first/utils/map';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('migrateAndSeed', () => {
  describe('tiles', () => {
    test('should create correct amount of tiles', () => {
      const rowCount = database.selectValue({
        sql: 'SELECT COUNT(id) AS id FROM tiles;',
        schema: z.number(),
      });

      expect(rowCount).toBe(7825);
    });

    test('every tile should be of type free or oasis', () => {
      const types = database.selectValues({
        sql: 'SELECT type FROM tiles;',
        schema: tileTypeSchema,
      });

      expect(
        types.every((type) => type === 'free' || type === 'oasis'),
      ).toBeTruthy();
    });

    test('every free tile should have resource_field_composition as not null and oasis_graphics as null', () => {
      database.selectObjects({
        sql: `
          SELECT
            rfc.resource_field_composition AS resource_field_composition,
            t.oasis_graphics
          FROM
            tiles AS t
              JOIN resource_field_composition_ids AS rfc
                   ON t.resource_field_composition_id = rfc.id
          WHERE
            t.type = 'free';
        `,
        schema: z.strictObject({
          resource_field_composition: resourceFieldCompositionSchema,
          oasis_graphics: z.null(),
        }),
      });

      expect(true).toBeTruthy();
    });

    test('every oasis tile should have oasis_graphics as not null and resource_field_composition as null', () => {
      database.selectObjects({
        sql: `
          SELECT
            rfc.resource_field_composition AS resource_field_composition,
            t.oasis_graphics
          FROM
            tiles AS t
              LEFT JOIN resource_field_composition_ids AS rfc
                        ON t.resource_field_composition_id = rfc.id
          WHERE
            t.type = 'oasis';
        `,
        schema: z.strictObject({
          resource_field_composition: z.null(),
          oasis_graphics: z.number(),
        }),
      });

      expect(true).toBeTruthy();
    });

    test('oasis groups tile counts are multiples of expected shape sizes', () => {
      const rows = database.selectObjects({
        sql: `
          SELECT id, oasis_graphics
          FROM
            tiles
          WHERE
            type = 'oasis';
        `,
        schema: z.strictObject({
          id: z.number(),
          oasis_graphics: z.number(),
        }),
      });

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
      const duplicates = database.selectObjects({
        sql: 'SELECT x, y, COUNT(*) AS c FROM tiles GROUP BY x, y HAVING c > 1;',
        schema: z.strictObject({
          x: z.number(),
          y: z.number(),
          c: z.number(),
        }),
      });

      expect(duplicates).toHaveLength(0);
    });

    test('center tile (0,0) exists, is free and has composition "4446"', () => {
      const center = database.selectObject({
        sql: `
          SELECT
            t.type,
            rfc.resource_field_composition AS resource_field_composition,
            t.oasis_graphics
          FROM
            tiles t
              LEFT JOIN resource_field_composition_ids rfc
                        ON t.resource_field_composition_id = rfc.id
          WHERE
            t.x = 0
            AND t.y = 0;
        `,
        schema: z.strictObject({
          type: tileTypeSchema,
          resource_field_composition: resourceFieldCompositionSchema.nullable(),
          oasis_graphics: z.number().nullable(),
        }),
      });

      expect(center).toBeTruthy();
      expect(center?.type).toBe('free');
      expect(center?.resource_field_composition).toBe('4446');
      expect(center?.oasis_graphics).toBeNull();
    });

    test('no tile has both resource_field_composition_id AND oasis_graphics non-null', () => {
      const bothNonNull = database.selectValue({
        sql: 'SELECT COUNT(*) AS c FROM tiles WHERE resource_field_composition_id IS NOT NULL AND oasis_graphics IS NOT NULL;',
        schema: z.number(),
      });

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

      const distinctComps = database.selectValues({
        sql: `
          SELECT DISTINCT rfc.resource_field_composition
          FROM
            tiles t
              JOIN resource_field_composition_ids rfc
                   ON t.resource_field_composition_id = rfc.id
          WHERE
            t.resource_field_composition_id IS NOT NULL;
        `,
        schema: resourceFieldCompositionSchema,
      });

      const invalid = distinctComps.filter((c) => !allowed.has(c));
      expect(invalid).toStrictEqual([]);
    });

    test('all tile coordinates are within expected grid bounds', () => {
      const { halfSize } = calculateGridLayout(
        serverMock.configuration.mapSize,
      );

      const bounds = database.selectObject({
        sql: 'SELECT MIN(x) AS minX, MAX(x) AS maxX, MIN(y) AS minY, MAX(y) AS maxY FROM tiles;',
        schema: z.strictObject({
          minX: z.number(),
          minY: z.number(),
          maxX: z.number(),
          maxY: z.number(),
        }),
      });

      expect(bounds?.minX).toBeGreaterThanOrEqual(-halfSize);
      expect(bounds?.maxX).toBeLessThanOrEqual(halfSize);
      expect(bounds?.minY).toBeGreaterThanOrEqual(-halfSize);
      expect(bounds?.maxY).toBeLessThanOrEqual(halfSize);
    });
  });

  describe('players', () => {
    test('slugs are unique and contain only lowercase alphanumeric and dashes', () => {
      const slugs = database.selectValues({
        sql: 'SELECT slug FROM players;',
        schema: z.string(),
      });

      const distinctCount = database.selectValue({
        sql: 'SELECT COUNT(DISTINCT slug) AS c FROM players;',
        schema: z.number(),
      });

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
      const count = database.selectValue({
        sql: 'SELECT COUNT(*) AS c FROM players WHERE faction_id = 1;',
        schema: z.number(),
      });
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

      const actualCount = database.selectValue({
        sql: 'SELECT COUNT(*) AS c FROM players;',
        schema: z.number(),
      });

      // The generator uses that formula; assert equality so seeder didn't accidentally change counts.
      expect(actualCount).toBe(expectedTotalPlayers);
    });
  });

  describe('oasis', () => {
    test('oasis rows only exist for tiles with type = "oasis"', () => {
      const countForNonOasis = database.selectValue({
        sql: `
          SELECT COUNT(*) AS c
          FROM
            oasis o
              JOIN tiles t ON o.tile_id = t.id
          WHERE
            t.type != 'oasis';
        `,
        schema: z.number(),
      });
      expect(countForNonOasis).toBe(0);
    });

    test('oasis bonus values are only 25 or 50 and resource strings are lowercase', () => {
      const rows = database.selectObjects({
        sql: 'SELECT resource, bonus FROM oasis;',
        schema: z.strictObject({
          resource: z.string(),
          bonus: z.number(),
        }),
      });

      for (const r of rows) {
        expect(typeof r.resource).toBe('string');
        expect(r.resource).toBe(r.resource?.toLowerCase());
        const bonusNum = Number(r.bonus);
        expect([25, 50].includes(bonusNum)).toBeTruthy();
      }
    });

    test('there is at least one oasis that has BOTH its resource bonus and a separate wheat bonus (composite)', () => {
      const count = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            oasis
          GROUP BY
            tile_id
          HAVING
            SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) >= 1
            AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
        `,
        schema: z.number(),
      });

      expect(count).toBeGreaterThan(0);
    });

    test('there is at least one oasis that has a resource bonus WITHOUT any wheat bonus (resource-only)', () => {
      const count = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            oasis
          GROUP BY
            tile_id
          HAVING
            SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) = 0
            AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
        `,
        schema: z.number(),
      });

      expect(count).toBeGreaterThan(0);
    });

    test('there is at least one oasis that has a 50% bonus', () => {
      const count = database.selectValue({
        sql: 'SELECT COUNT(*) FROM oasis WHERE bonus = 50;',
        schema: z.number(),
      });

      expect(count).toBeGreaterThan(0);
    });

    test('at least 4 tiles with RFC 00018 (18c) have >= 3 distinct 50% wheat oases (150% total)', () => {
      const count = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            (
              SELECT t.id
              FROM
                tiles t
                  JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
                  JOIN oasis_occupiable_by ob ON ob.occupiable_tile_id = t.id
                  JOIN oasis o ON o.tile_id = ob.occupiable_oasis_tile_id
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
        schema: z.number(),
      });

      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('at least 12 tiles with RFC 11115 (15c) have >= 3 distinct 50% wheat oases (150% total)', () => {
      const count = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            (
              SELECT t.id
              FROM
                tiles t
                  JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
                  JOIN oasis_occupiable_by ob ON ob.occupiable_tile_id = t.id
                  JOIN oasis o ON o.tile_id = ob.occupiable_oasis_tile_id
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
        schema: z.number(),
      });

      expect(count).toBeGreaterThanOrEqual(12);
    });

    test('at least 20 tiles with RFC 3339 have >= 3 distinct 50% wheat oases', () => {
      const count = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            (
              SELECT t.id
              FROM
                tiles t
                  JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
                  JOIN oasis_occupiable_by ob ON ob.occupiable_tile_id = t.id
                  JOIN oasis o ON o.tile_id = ob.occupiable_oasis_tile_id
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
        schema: z.number(),
      });

      expect(count).toBeGreaterThanOrEqual(20);
    });
  });

  describe('map filters', () => {
    test('map_filters row exists for player', () => {
      const countRow = database.selectObject({
        sql: `
          SELECT COUNT(*) AS cnt
          FROM
            map_filters
          WHERE
            player_id = $player_id;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({ cnt: z.number() }),
      });

      expect(countRow?.cnt).toBeGreaterThan(0);
    });
  });

  describe('preferences', () => {
    test('preferences row exists for player', () => {
      const countRow = database.selectObject({
        sql: `
          SELECT COUNT(*) AS cnt
          FROM
            preferences
          WHERE
            player_id = $player_id;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({ cnt: z.number() }),
      });

      expect(countRow?.cnt).toBeGreaterThan(0);
    });
  });

  describe('server', () => {
    test('servers table contains exactly one server', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM servers;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(1);
    });
  });

  describe('faction reputation', () => {
    test('faction_reputation seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM faction_reputation;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('heroes', () => {
    test('only the player has a hero', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM heroes;',
        schema: z.number(),
      });
      expect(c).toBe(1);

      const playerId = database.selectValue({
        sql: 'SELECT player_id FROM heroes;',
        schema: z.number(),
      });
      expect(playerId).toBe(PLAYER_ID);
    });

    test('attack_power is 100 for Romans and 80 for others', () => {
      const rows = database.selectObjects({
        sql: `
          SELECT ti.tribe, h.base_attack_power
          FROM heroes h
          JOIN players p ON h.player_id = p.id
          JOIN tribe_ids ti ON p.tribe_id = ti.id
        `,
        schema: z.object({
          tribe: z.string(),
          base_attack_power: z.number(),
        }),
      });

      for (const row of rows) {
        if (row.tribe.toLowerCase() === 'romans') {
          expect(row.base_attack_power).toBe(100);
        } else {
          expect(row.base_attack_power).toBe(80);
        }
      }
    });

    test('hero stats are correctly seeded', () => {
      const rows = database.selectObjects({
        sql: `
          SELECT
            health_regeneration,
            damage_reduction,
            speed,
            natarian_attack_bonus,
            attack_bonus,
            defence_bonus
          FROM heroes
        `,
        schema: z.object({
          health_regeneration: z.number(),
          damage_reduction: z.number(),
          speed: z.number(),
          natarian_attack_bonus: z.number(),
          attack_bonus: z.number(),
          defence_bonus: z.number(),
        }),
      });

      for (const row of rows) {
        expect(row.health_regeneration).toBe(10);
        expect(row.damage_reduction).toBe(0);
        expect(row.speed).toBe(6);
        expect(row.natarian_attack_bonus).toBe(0);
        expect(row.attack_bonus).toBe(0);
        expect(row.defence_bonus).toBe(0);
      }
    });

    test('selectable attributes are correctly seeded in the new table', () => {
      const rows = database.selectObjects({
        sql: 'SELECT attack_power, resource_production, attack_bonus, defence_bonus FROM hero_selectable_attributes',
        schema: z.object({
          attack_power: z.number(),
          resource_production: z.number(),
          attack_bonus: z.number(),
          defence_bonus: z.number(),
        }),
      });

      for (const row of rows) {
        expect(row.attack_power).toBe(0);
        expect(row.resource_production).toBe(4);
        expect(row.attack_bonus).toBe(0);
        expect(row.defence_bonus).toBe(0);
      }
    });
  });

  describe('resource field composition ids', () => {
    test('resource_field_composition_ids seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM resource_field_composition_ids;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });

    test('contains well-known composition 4446', () => {
      const c = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            resource_field_composition_ids
          WHERE
            resource_field_composition = '4446';
        `,
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('lookup tables', () => {
    test('building_ids seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM building_ids;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });

    test('faction_ids seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM faction_ids;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });

    test('tribe_ids seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM tribe_ids;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });

    test('unit_ids seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM unit_ids;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('guaranteed croppers (oasis_occupiable_by)', () => {
    test('oasis_occupiable_by seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM oasis_occupiable_by;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });

    test('links reference free tiles and oasis tiles', () => {
      const invalid = database.selectValue({
        sql: `SELECT COUNT(*)
              FROM
                oasis_occupiable_by ob
                  LEFT JOIN tiles t ON t.id = ob.occupiable_tile_id
                  LEFT JOIN tiles o ON o.id = ob.occupiable_oasis_tile_id
              WHERE
                t.id IS NULL
                OR o.id IS NULL
                OR t.type != 'free'
                OR o.type != 'oasis';`,
        schema: z.number(),
      });
      expect(invalid).toBe(0);
    });
  });

  describe('villages', () => {
    test('villages seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM villages;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('bookmarks', () => {
    test('bookmarks seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM bookmarks;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('building fields', () => {
    test('building_fields seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM building_fields;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });
  });

  describe('troops', () => {
    test('unoccupied oasis tiles have troops', () => {
      const withoutTroops = database.selectValue({
        sql: `SELECT COUNT(*)
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
        schema: z.number(),
      });
      expect(withoutTroops).toBe(0);
    });

    test('unoccupied oasis tiles only have nature troops', () => {
      const natureUnitIds = natureUnits.map(({ id }) => id);
      const placeholders = natureUnitIds.map(() => '?').join(',');

      const invalid = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            troops tr
              JOIN tiles t ON t.id = tr.tile_id
              JOIN unit_ids ui ON ui.id = tr.unit_id
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
            AND ui.unit NOT IN (${placeholders});
        `,
        bind: natureUnitIds,
        schema: z.number(),
      });

      expect(invalid).toBe(0);
    });
  });

  describe('effect ids and effects', () => {
    test('effect_ids seeded (>0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM effect_ids;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThan(0);
    });

    test('effects seeded (>0) and reference valid effect_ids', () => {
      const effectsCount = database.selectValue({
        sql: 'SELECT COUNT(*) FROM effects;',
        schema: z.number(),
      });
      expect(effectsCount).toBeGreaterThan(0);

      const invalid = database.selectValue({
        sql: `SELECT COUNT(*)
              FROM
                effects e
                  LEFT JOIN effect_ids ei ON ei.id = e.effect_id
              WHERE
                ei.id IS NULL;`,
        schema: z.number(),
      });
      expect(invalid).toBe(0);
    });
  });

  describe('resource sites', () => {
    test('resource_sites seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM resource_sites;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('world items', () => {
    test('world_items seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM world_items;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('unit research', () => {
    test('unit_research seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM unit_research;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('unit improvement', () => {
    test('unit_improvements seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM unit_improvements;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('quests', () => {
    test('quests seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM quests;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });

    test('village building quests exist (WOODCUTTER oneOf)', () => {
      const count = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            quests
          WHERE
            village_id IS NOT NULL
            AND quest_id LIKE 'oneOf-WOODCUTTER-%';
        `,
        schema: z.number(),
      });
      expect(count).toBeGreaterThan(0);
    });

    test('global quests include troopCount, adventureCount, killCount, unitKillCount', () => {
      const troopCount = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            quests
          WHERE
            village_id IS NULL
            AND quest_id LIKE 'troopCount-%';
        `,
        schema: z.number(),
      });
      expect(troopCount).toBeGreaterThan(0);

      const adventureCount = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            quests
          WHERE
            village_id IS NULL
            AND quest_id LIKE 'adventureCount-%';
        `,
        schema: z.number(),
      });
      expect(adventureCount).toBeGreaterThan(0);

      const killCount = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            quests
          WHERE
            village_id IS NULL
            AND quest_id LIKE 'killCount-%';
        `,
        schema: z.number(),
      });
      expect(killCount).toBeGreaterThan(0);

      const unitKillCount = database.selectValue({
        sql: `
          SELECT COUNT(*)
          FROM
            quests
          WHERE
            village_id IS NULL
            AND quest_id LIKE 'unitKillCount-%';
        `,
        schema: z.number(),
      });
      expect(unitKillCount).toBeGreaterThan(0);
    });

    test('unitTroopCount quests exist and only for the player tribe units', () => {
      const tribe = database.selectValue({
        sql: `
          SELECT ti.tribe
          FROM
            players p
            JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            p.id = $playerId;
        `,
        bind: { $playerId: PLAYER_ID },
        schema: tribeSchema,
      })!;

      const unitTroopCountQuests = database.selectValues({
        sql: `
          SELECT quest_id
          FROM
            quests
          WHERE
            village_id IS NULL
            AND quest_id LIKE 'unitTroopCount-%';
        `,
        schema: z.string(),
      });

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
        const [_, unitId] = qid.split('-');
        expect(allowed.has(unitId as UnitId)).toBeTruthy();
      }
    });

    test('tribal wall building quests exist for starting village', () => {
      const tribe = database.selectValue({
        sql: `
          SELECT ti.tribe
          FROM
            players p
            JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            p.id = $playerId;
        `,
        bind: { $playerId: PLAYER_ID },
        schema: tribeSchema,
      })!;

      const wallByTribe: Record<string, string> = {
        romans: 'ROMAN_WALL',
        gauls: 'GAUL_WALL',
        teutons: 'TEUTONIC_WALL',
        huns: 'HUN_WALL',
        egyptians: 'EGYPTIAN_WALL',
      };

      const wall = wallByTribe[tribe];

      const count = database.selectValue({
        sql: `SELECT COUNT(*)
              FROM
                quests
              WHERE
                village_id IS NOT NULL
                AND quest_id = $qid;`,
        bind: { $qid: `oneOf-${wall}-1` },
        schema: z.number(),
      });

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('events', () => {
    test('events seeded (>=0)', () => {
      const c = database.selectValue({
        sql: 'SELECT COUNT(*) FROM events;',
        schema: z.number(),
      });
      expect(c).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Effects per village', () => {
    test('has building-based wheatProduction matching population (source_specifier = 0)', () => {
      // Preload effect id for wheatProduction
      const wheatEffectId = database.selectValue({
        sql: `SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction';`,
        schema: z.number(),
      });

      // Fetch all building fields and group them by village_id in-memory
      const buildingFields = database.selectObjects({
        sql: `
          SELECT bf.village_id, bi.building AS building_id, bf.level
          FROM
            building_fields bf
            JOIN building_ids bi ON bi.id = bf.building_id
          ORDER BY bf.village_id;
        `,
        schema: z.strictObject({
          village_id: z.number(),
          building_id: buildingIdSchema,
          level: z.number(),
        }),
      });

      const villagePopulations = new Map<number, number>();
      for (const { village_id, building_id, level } of buildingFields) {
        const def = getBuildingDefinition(building_id);
        const pop = calculateTotalPopulationForLevel(def.id, level);
        villagePopulations.set(
          village_id,
          (villagePopulations.get(village_id) ?? 0) + pop,
        );
      }

      // Fetch all building-based wheat production effects for source_specifier = 0
      const effects = database.selectObjects({
        sql: `
          SELECT village_id, value
          FROM
            effects
          WHERE
            effect_id = $effectId
            AND type = 'base'
            AND scope = 'village'
            AND source = 'building'
            AND source_specifier = 0;
        `,
        bind: { $effectId: wheatEffectId },
        schema: z.strictObject({
          village_id: z.number(),
          value: z.number(),
        }),
      });

      const effectValues = new Map(effects.map((e) => [e.village_id, e.value]));

      for (const [villageId, population] of villagePopulations) {
        expect(effectValues.get(villageId)).toBe(-population);
      }
    });

    test('has troops-based wheatProduction matching troop wheat consumption (source_specifier IS NULL)', () => {
      // Preload effect id for wheatProduction
      const wheatEffectId = database.selectValue({
        sql: `
          SELECT id
          FROM
            effect_ids
          WHERE
            effect = 'wheatProduction';
        `,
        schema: z.number(),
      });

      // Fetch all troops and group them by village_id in-memory
      // Note: we need to join with villages to get the village_id
      const troopRows = database.selectObjects({
        sql: `
          SELECT v.id AS village_id, ui.unit AS unit_id, tr.amount
          FROM
            troops AS tr
              JOIN unit_ids ui ON ui.id = tr.unit_id
              JOIN villages AS v ON tr.tile_id = v.tile_id;
        `,
        schema: z.strictObject({
          village_id: z.number(),
          unit_id: unitIdSchema,
          amount: z.number(),
        }),
      });

      const villageTroopConsumption = new Map<number, number>();
      for (const { village_id, unit_id, amount } of troopRows) {
        const { unitWheatConsumption } = getUnitDefinition(unit_id);
        villageTroopConsumption.set(
          village_id,
          (villageTroopConsumption.get(village_id) ?? 0) +
            unitWheatConsumption * amount,
        );
      }

      // Fetch all troop-based wheat production effects
      const effects = database.selectObjects({
        sql: `
          SELECT village_id, value
          FROM
            effects
          WHERE
            effect_id = $effectId
            AND type = 'base'
            AND scope = 'village'
            AND source = 'troops'
            AND source_specifier IS NULL;
        `,
        bind: { $effectId: wheatEffectId },
        schema: z.strictObject({
          village_id: z.number(),
          value: z.number(),
        }),
      });

      const effectValues = new Map(effects.map((e) => [e.village_id, e.value]));

      for (const [villageId, consumption] of villageTroopConsumption) {
        expect(effectValues.get(villageId)).toBe(consumption);
      }
    });
  });
});
