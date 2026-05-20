import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { playerSchema } from '@pillage-first/types/models/player';
import { createController } from '../utils/controller';
import {
  mapPlayerVillage,
  mapPlayerVillageWithPopulation,
  mapSentReinforcement,
  mapVillageTroop,
} from './mappers/player-mapper';
import {
  getPlayerVillagesWithPopulationSchema,
  getSentReinforcementsByVillageSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
} from './schemas/player-schemas';
import {
  handleRelocateReinforcements,
  handleReturnReinforcements,
} from './utils/reinforcements';

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

export const getSentReinforcementsByVillage = createController(
  '/villages/:villageId/sent-reinforcements',
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: `
      SELECT
        v.id AS village_id,
        v.tile_id,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        v.name,
        v.slug,
        rfc.resource_field_composition AS resource_field_composition,
        ui.unit AS unit_id,
        tr.amount,
        tr.source_tile_id
      FROM
        troops tr
          JOIN villages cv
               ON cv.id = $village_id
          JOIN villages v
               ON v.tile_id = tr.tile_id
          JOIN tiles t
               ON t.id = v.tile_id
          LEFT JOIN resource_field_composition_ids rfc
                    ON t.resource_field_composition_id = rfc.id
          JOIN unit_ids ui
               ON ui.id = tr.unit_id
      WHERE
        tr.source_tile_id = cv.tile_id
        AND tr.tile_id != cv.tile_id
      ORDER BY
        v.name,
        v.id,
        ui.id;
    `,
    bind: { $village_id: villageId },
    schema: getSentReinforcementsByVillageSchema,
  });

  const groupedReinforcements = new Map<
    number,
    ReturnType<typeof mapSentReinforcement>
  >();

  for (const row of rows) {
    const mapped = mapSentReinforcement(row);
    const existing = groupedReinforcements.get(mapped.village.id);

    if (existing) {
      existing.troops.push(...mapped.troops);
      continue;
    }

    groupedReinforcements.set(mapped.village.id, mapped);
  }

  return [...groupedReinforcements.values()];
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

    handleRelocateReinforcements({
      db,
      villageId,
      stationedTileId: currentVillageTile,
      homeTileId: sourceTileId,
      targetTileId: currentVillageTile,
      troops,
      relocateHeroFromVillageId: sourceVillageId,
    });
  });
});

export const returnReinforcements = createController(
  '/villages/:villageId/return-reinforcements',
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
          v.tile_id AS currentVillageTile
        FROM villages v
        WHERE v.id = $village_id
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

    handleReturnReinforcements({
      db,
      originTileId: currentVillageTile,
      targetTileId: sourceTileId,
      homeTileId: sourceTileId,
      eventVillageId: sourceVillageId,
      troops,
    });
  });
});

export const returnSentReinforcements = createController(
  '/villages/:villageId/return-sent-reinforcements',
  'post',
)(({ database, path: { villageId }, body: { stationedTileId, troops } }) => {
  database.transaction((db) => {
    const { currentVillageTile } = db.selectObject({
      sql: `
        SELECT tile_id AS currentVillageTile
        FROM villages
        WHERE id = $village_id
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.strictObject({
        currentVillageTile: z.number(),
      }),
    })!;

    handleReturnReinforcements({
      db,
      originTileId: stationedTileId,
      targetTileId: currentVillageTile,
      homeTileId: currentVillageTile,
      eventVillageId: villageId,
      troops,
    });
  });
});

export const relocateSentReinforcements = createController(
  '/villages/:villageId/relocate-sent-reinforcements',
  'post',
)(({ database, path: { villageId }, body: { stationedTileId, troops } }) => {
  database.transaction((db) => {
    const { currentVillageTile, stationedVillageId } = db.selectObject({
      sql: `
        SELECT
          cv.tile_id AS currentVillageTile,
          sv.id AS stationedVillageId
        FROM villages cv
          LEFT JOIN villages sv ON sv.tile_id = $stationed_tile_id
        WHERE cv.id = $village_id
      `,
      bind: {
        $stationed_tile_id: stationedTileId,
        $village_id: villageId,
      },
      schema: z.strictObject({
        currentVillageTile: z.number(),
        stationedVillageId: z.number().nullable(),
      }),
    })!;

    if (stationedVillageId === null) {
      throw new Error('Stationed village not found');
    }

    handleRelocateReinforcements({
      db,
      villageId,
      stationedTileId,
      homeTileId: currentVillageTile,
      targetTileId: stationedTileId,
      troops,
      relocateHeroToVillageId: stationedVillageId,
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
