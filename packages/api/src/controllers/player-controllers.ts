import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Troop } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createController } from '../utils/controller';
import {
  mapPlayerVillage,
  mapPlayerVillageWithPopulation,
  mapVillageTroop,
} from './mappers/player-mapper';
import { relocateHero } from './resolvers/utils/hero';
import {
  getPlayerVillagesWithPopulationSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
} from './schemas/player-schemas';
import { createEvents } from './utils/create-event';

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
  const rows = database.selectObjects({
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

  return rows.map(mapPlayerVillage);
});

export const getPlayerVillagesWithPopulation = createController(
  '/players/:playerId/villages-with-population',
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
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

  return rows.map(mapPlayerVillageWithPopulation);
});

export const getTroopsByVillage = createController(
  '/villages/:villageId/troops',
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
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

  return rows.map(mapVillageTroop);
});

export const renameVillage = createController(
  '/villages/:villageId',
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

const decrementReinforcementsFromVillage = (
  db: DbFacade,
  currentVillageTile: Tile['id'],
  sourceTileId: Tile['id'],
  troops: Omit<Troop, 'source' | 'tileId'>[],
) => {
  if (troops.length === 0) {
    return;
  }

  const aggregatedTroops = Array.from(
    troops.reduce((requestedTroops, { unitId, amount }) => {
      requestedTroops.set(unitId, (requestedTroops.get(unitId) ?? 0) + amount);

      return requestedTroops;
    }, new Map<Troop['unitId'], number>()),
    ([unitId, amount]) => ({ unitId, amount }),
  );

  const requestedValuesSql = aggregatedTroops
    .map((_, index) => `($unit_id_${index}, $amount_${index})`)
    .join(',\n          ');

  const requestedTroopsSql = `
    WITH
      requested_troops(unit_id, amount) AS (
        VALUES
          ${requestedValuesSql}
        ),
      requested_troops_with_ids AS (
        SELECT
          ui.id AS db_unit_id,
          rt.unit_id,
          rt.amount
        FROM
          requested_troops rt
            JOIN unit_ids ui ON ui.unit = rt.unit_id
        )
  `;
  const bind: Record<string, number | string> = {
    $tile_id: currentVillageTile,
    $source_tile_id: sourceTileId,
  };

  for (const [index, { unitId, amount }] of aggregatedTroops.entries()) {
    bind[`$unit_id_${index}`] = unitId;
    bind[`$amount_${index}`] = amount;
  }

  const unavailableTroops = db.selectValues({
    sql: `
      ${requestedTroopsSql}
      SELECT rtwi.unit_id
      FROM
        requested_troops_with_ids rtwi
          LEFT JOIN troops t
                    ON t.unit_id = rtwi.db_unit_id
                      AND t.tile_id = $tile_id
                      AND t.source_tile_id = $source_tile_id
      WHERE
        t.amount IS NULL
        OR t.amount < rtwi.amount
    `,
    bind,
    schema: z.string(),
  });

  if (unavailableTroops.length > 0) {
    throw new Error('Not enough troops available for relocation');
  }

  db.exec({
    sql: `
      ${requestedTroopsSql}
      DELETE
      FROM
        troops
      WHERE
        tile_id = $tile_id
        AND source_tile_id = $source_tile_id
        AND EXISTS
        (
          SELECT 1
          FROM
            requested_troops_with_ids rtwi
          WHERE
            rtwi.db_unit_id = troops.unit_id
            AND troops.amount = rtwi.amount
          )
    `,
    bind,
  });

  db.exec({
    sql: `
      ${requestedTroopsSql}
      UPDATE troops
      SET
        amount = amount - (
          SELECT rtwi.amount
          FROM
            requested_troops_with_ids rtwi
          WHERE
            rtwi.db_unit_id = troops.unit_id
          )
      WHERE
        tile_id = $tile_id
        AND source_tile_id = $source_tile_id
        AND EXISTS
        (
          SELECT 1
          FROM
            requested_troops_with_ids rtwi
          WHERE
            rtwi.db_unit_id = troops.unit_id
            AND troops.amount > rtwi.amount
          )
    `,
    bind,
  });
};

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
            FROM
              villages
            WHERE
              tile_id = $source_tile_id
            ) AS sourceVillageId,
          tile_id AS currentVillageTile
        FROM
          villages
        WHERE
          id = $village_id
      `,
      bind: {
        $source_tile_id: sourceTileId,
        $village_id: villageId,
      },
      schema: z.strictObject({
        sourceVillageId: z.number(),
        currentVillageTile: z.number(),
      }),
    })!;

    decrementReinforcementsFromVillage(
      db,
      currentVillageTile,
      sourceTileId,
      troops,
    );

    for (const troop of troops) {
      db.exec({
        sql: `
          INSERT INTO
            troops (tile_id, source_tile_id, unit_id, amount)
          VALUES
            ($tile_id, $target_source_tile_id, (
              SELECT id
              FROM
                unit_ids
              WHERE
                unit = $unit_id
              ), $amount)
          ON CONFLICT (tile_id, source_tile_id, unit_id)
            DO UPDATE
            SET
              amount = amount + $amount
        `,
        bind: {
          $tile_id: currentVillageTile,
          $target_source_tile_id: currentVillageTile,
          $unit_id: troop.unitId,
          $amount: troop.amount,
        },
      });
    }

    if (troops.some(({ unitId }) => unitId === 'HERO')) {
      relocateHero(db, sourceVillageId, villageId, Date.now());
    }
  });
});

export const returnReinforcements = createController(
  '/villages/:villageId/return-reinforcements',
  'post',
)(({ database, path: { villageId }, body: { sourceTileId, troops } }) => {
  database.transaction((db) => {
    const {
      sourceVillageId,
      currentVillageTile,
      currentVillageX,
      currentVillageY,
      sourceVillageX,
      sourceVillageY,
    } = db.selectObject({
      sql: `
        SELECT
          (
            SELECT id
            FROM villages
            WHERE tile_id = $source_tile_id
          ) AS sourceVillageId,
          v.tile_id AS currentVillageTile,
          ct.x AS currentVillageX,
          ct.y AS currentVillageY,
          st.x AS sourceVillageX,
          st.y AS sourceVillageY
        FROM villages v
          JOIN tiles ct ON ct.id = v.tile_id
          LEFT JOIN tiles st ON st.id = $source_tile_id
        WHERE v.id = $village_id
      `,
      bind: {
        $source_tile_id: sourceTileId,
        $village_id: villageId,
      },
      schema: z.strictObject({
        sourceVillageId: z.number(),
        currentVillageTile: z.number(),
        currentVillageX: z.number(),
        currentVillageY: z.number(),
        sourceVillageX: z.number(),
        sourceVillageY: z.number(),
      }),
    })!;

    if (sourceVillageX === null || sourceVillageY === null) {
      throw new Error('Source village tile not found');
    }

    decrementReinforcementsFromVillage(
      db,
      currentVillageTile,
      sourceTileId,
      troops,
    );

    createEvents<'troopMovementReturn'>(db, {
      type: 'troopMovementReturn',
      villageId: sourceVillageId,
      originalMovementType: 'troopMovementReturnReinforcements',
      troops: troops.map((troop) => ({
        ...troop,
        source: sourceTileId,
        tileId: sourceTileId,
      })),
      startsAt: Date.now(),
      originCoordinates: {
        x: currentVillageX,
        y: currentVillageY,
      },
      targetCoordinates: {
        x: sourceVillageX,
        y: sourceVillageY,
      },
    });
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
