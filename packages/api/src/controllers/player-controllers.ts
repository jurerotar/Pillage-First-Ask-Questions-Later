import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import { createController } from '../utils/controller';
import {
  getPlayerVillagesWithPopulationSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
} from './schemas/player-schemas';

export const getMe = createController('/players/me')(({ database }) => {
  return database.selectObject({
    sql: `
      SELECT
        p.id,
        p.name,
        p.slug,
        ti.tribe,
        fi.faction AS faction
      FROM
        players p
          JOIN tribe_ids ti ON p.tribe_id = ti.id
          LEFT JOIN factions f ON f.id = p.faction_id
          LEFT JOIN faction_ids fi ON f.faction_id = fi.id
      WHERE
        p.id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: playerSchema,
  })!;
});

export const getPlayerVillageListing = createController(
  '/players/:playerId/villages',
)(({ database, path: { playerId } }) => {
  return database.selectObjects({
    sql: `
      SELECT
        v.id,
        v.tile_id,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        v.name,
        v.slug,
        rfc.resource_field_composition AS resource_field_composition
      FROM
        villages v
          JOIN tiles t
               ON t.id = v.tile_id
          LEFT JOIN resource_field_composition_ids rfc
                    ON t.resource_field_composition_id = rfc.id
      WHERE
        v.player_id = $player_id;
    `,
    bind: { $player_id: playerId },
    schema: getVillagesByPlayerSchema,
  });
});

export const getPlayerVillagesWithPopulation = createController(
  '/players/:playerId/villages-with-population',
)(({ database, path: { playerId } }) => {
  return database.selectObjects({
    sql: `
      SELECT
        v.id,
        v.tile_id,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        v.name,
        v.slug,
        rfc.resource_field_composition AS resource_field_composition,
        (
          SELECT COALESCE(SUM(level), 0) FROM building_fields WHERE village_id = v.id
          ) AS population
      FROM
        villages v
          JOIN tiles t
               ON t.id = v.tile_id
          LEFT JOIN resource_field_composition_ids rfc
                    ON t.resource_field_composition_id = rfc.id
      WHERE
        v.player_id = $player_id;
    `,
    bind: { $player_id: playerId },
    schema: getPlayerVillagesWithPopulationSchema,
  });
});

export const getTroopsByVillage = createController(
  '/villages/:villageId/troops',
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: `
      SELECT
        ui.unit AS unit_id,
        t.amount,
        t.tile_id,
        t.source_tile_id
      FROM
        troops t
        JOIN unit_ids ui ON ui.id = t.unit_id
      WHERE
        t.tile_id = (
          SELECT v.tile_id
          FROM villages v
          WHERE v.id = $village_id
        );
    `,
    bind: { $village_id: villageId },
    schema: getTroopsByVillageSchema,
  });
});

export const renameVillage = createController(
  '/villages/:villageId/rename',
  'patch',
)(({ database, path: { villageId }, body: { name } }) => {
  database.exec({
    sql: `
      UPDATE villages
      SET name = $name
      WHERE id = $village_id
    `,
    bind: { $name: name, $village_id: villageId },
  });
});

export const getPlayerBySlug = createController('/players/:playerSlug')(
  ({ database, path: { playerSlug } }) => {
    return database.selectObject({
      sql: `
      SELECT
        p.id,
        p.name,
        p.slug,
        ti.tribe,
        fi.faction
      FROM players p
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      JOIN villages v
        ON v.player_id = p.id
      LEFT JOIN factions f
        ON f.id = p.faction_id
      LEFT JOIN faction_ids fi
        ON f.faction_id = fi.id
      WHERE
        p.slug = $player_slug
      LIMIT 1;
    `,
      bind: {
        $player_slug: playerSlug,
      },
      schema: playerSchema,
    })!;
  },
);
