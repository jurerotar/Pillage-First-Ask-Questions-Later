import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import { createController } from '../utils/controller';
import { relocateHero } from './resolvers/utils/hero';
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
          LEFT JOIN faction_ids fi ON fi.id = p.faction_id
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
        COALESCE(SUM(CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END), 0) AS population
      FROM
        villages v
          JOIN tiles t
               ON t.id = v.tile_id
          LEFT JOIN resource_field_composition_ids rfc
                    ON t.resource_field_composition_id = rfc.id
          LEFT JOIN effects e
                    ON e.village_id = v.id
                      AND e.type = 'base'
                      AND e.scope = 'village'
                      AND e.source = 'building'
                      AND e.source_specifier = 0
          LEFT JOIN effect_ids ei ON ei.id = e.effect_id
      WHERE
        v.player_id = $player_id
      GROUP BY
        v.id, v.tile_id, t.x, t.y, v.name, v.slug, rfc.resource_field_composition
      ORDER BY population DESC;
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

export const relocateReinforcements = createController(
  '/villages/:villageId/relocate-reinforcements',
  'post',
)(({ database, path: { villageId }, body: { sourceTileId, troops } }) => {
  database.transaction((db) => {
    const { sourceVillageId, currentVillageTile } = db.selectObject({
      sql: `
        SELECT
          (
            SELECT id
            FROM villages
            WHERE tile_id = $source_tile_id
          ) AS sourceVillageId,
          tile_id AS currentVillageTile
        FROM villages
        WHERE id = $village_id
      `,
      bind: {
        $source_tile_id: sourceTileId,
        $village_id: villageId,
      },
      schema: z.strictObject({
        sourceVillageId: z.number().nullable(),
        currentVillageTile: z.number(),
      }),
    })!;

    if (!currentVillageTile) {
      throw new Error('Village not found');
    }

    if (!sourceVillageId) {
      throw new Error('Source village not found');
    }

    for (const troop of troops) {
      const availableAmount = db.selectValue({
        sql: `
          SELECT amount
          FROM troops t
            JOIN unit_ids ui ON ui.id = t.unit_id
          WHERE
            t.tile_id = $tile_id
            AND t.source_tile_id = $source_tile_id
            AND ui.unit = $unit_id
          LIMIT 1
        `,
        bind: {
          $tile_id: currentVillageTile,
          $source_tile_id: sourceTileId,
          $unit_id: troop.unitId,
        },
        schema: z.number().nullable(),
      });

      if (!availableAmount || availableAmount < troop.amount) {
        throw new Error('Not enough troops available for relocation');
      }

      db.exec({
        sql: `
          UPDATE troops
          SET amount = amount - $amount
          WHERE
            tile_id = $tile_id
            AND source_tile_id = $source_tile_id
            AND unit_id = (
              SELECT id
              FROM unit_ids
              WHERE unit = $unit_id
            )
            AND amount >= $amount
        `,
        bind: {
          $tile_id: currentVillageTile,
          $source_tile_id: sourceTileId,
          $unit_id: troop.unitId,
          $amount: troop.amount,
        },
      });

      db.exec({
        sql: `
          INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
          VALUES (
            $tile_id,
            $target_source_tile_id,
            (
              SELECT id
              FROM unit_ids
              WHERE unit = $unit_id
            ),
            $amount
          )
          ON CONFLICT (tile_id, source_tile_id, unit_id)
          DO UPDATE
          SET amount = amount + $amount
        `,
        bind: {
          $tile_id: currentVillageTile,
          $target_source_tile_id: currentVillageTile,
          $unit_id: troop.unitId,
          $amount: troop.amount,
        },
      });

      db.exec({
        sql: `
          DELETE FROM troops
          WHERE
            tile_id = $tile_id
            AND source_tile_id = $source_tile_id
            AND unit_id = (
              SELECT id
              FROM unit_ids
              WHERE unit = $unit_id
            )
            AND amount = 0
        `,
        bind: {
          $tile_id: currentVillageTile,
          $source_tile_id: sourceTileId,
          $unit_id: troop.unitId,
        },
      });
    }

    if (troops.some(({ unitId }) => unitId === 'HERO')) {
      relocateHero(db, sourceVillageId, villageId, Date.now());
    }
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
      LEFT JOIN faction_ids fi
        ON fi.id = p.faction_id
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
