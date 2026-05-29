import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  sentReinforcementDtoSchema,
  villageTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import { playerSchema } from '@pillage-first/types/models/player';
import {
  selectPlayerByIdQuery,
  selectPlayerBySlugQuery,
  selectPlayerVillageListingQuery,
  selectPlayerVillagesWithPopulationQuery,
  selectSentReinforcementsByVillageQuery,
  selectSourceVillageByTileAndCurrentVillageQuery,
  selectStationedVillageByTileAndCurrentVillageQuery,
  selectVillageTileQuery,
  selectVillageTroopsQuery,
  updateVillageNameQuery,
} from '../../queries/player-queries';
import { relocateHero } from '../../utils/hero';
import {
  hasHero,
  moveStationedTroops,
  returnStationedTroops,
} from '../../utils/reinforcements';
import { createController } from '../controller';
import {
  mapPlayerVillage,
  mapPlayerVillageWithPopulation,
  mapSentReinforcements,
  mapVillageTroop,
} from './mappers/player-mapper';
import {
  getPlayerVillagesWithPopulationSchema,
  getSentReinforcementsByVillageSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
  relocateReinforcementsSchema,
  relocateSentReinforcementsSchema,
  returnReinforcementsSchema,
  returnSentReinforcementsSchema,
  sourceVillageRowSchema,
  stationedVillageRowSchema,
  villageTileRowSchema,
} from './schemas/player-schemas';

export const getMe = createController('/players/me', {
  summary: 'Get current player details',
  response: playerSchema,
})(({ database }) => {
  return database.selectObject({
    sql: selectPlayerByIdQuery,
    bind: { $player_id: PLAYER_ID },
    schema: playerSchema,
  })!;
});

export const getPlayerVillageListing = createController(
  '/players/:playerId/villages',
  {
    summary: 'Get player village listing',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.array(playerVillageDtoSchema),
  },
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerVillageListingQuery,
    bind: { $player_id: playerId },
    schema: getVillagesByPlayerSchema,
  });

  return rows.map(mapPlayerVillage);
});

export const getPlayerVillagesWithPopulation = createController(
  '/players/:playerId/villages-with-population',
  {
    summary: 'Get player villages with population',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.array(playerVillageWithPopulationDtoSchema),
  },
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerVillagesWithPopulationQuery,
    bind: { $player_id: playerId },
    schema: getPlayerVillagesWithPopulationSchema,
  });

  return rows.map(mapPlayerVillageWithPopulation);
});

export const getTroopsByVillage = createController(
  '/villages/:villageId/troops',
  {
    summary: 'Get troops by village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(villageTroopDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectVillageTroopsQuery,
    bind: { $village_id: villageId },
    schema: getTroopsByVillageSchema,
  });

  return rows.map(mapVillageTroop);
});

export const renameVillage = createController('/villages/:villageId', 'patch', {
  summary: 'Rename village',
  requestParams: {
    path: z.strictObject({
      villageId: z.coerce.number(),
    }),
  },
  requestBody: z.strictObject({
    name: z.string(),
  }),
})(({ database, path: { villageId }, body: { name } }) => {
  database.exec({
    sql: updateVillageNameQuery,
    bind: { $name: name, $village_id: villageId },
  });
});

export const getPlayerBySlug = createController('/players/:playerSlug', {
  summary: 'Get player by slug',
  requestParams: {
    path: z.strictObject({
      playerSlug: playerSchema.shape.slug,
    }),
  },
  response: playerSchema,
})(({ database, path: { playerSlug } }) => {
  return database.selectObject({
    sql: selectPlayerBySlugQuery,
    bind: {
      $player_slug: playerSlug,
    },
    schema: playerSchema,
  })!;
});

export const getSentReinforcementsByVillage = createController(
  '/villages/:villageId/sent-reinforcements',
  {
    summary: 'Get sent reinforcements by village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(sentReinforcementDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectSentReinforcementsByVillageQuery,
    bind: { $village_id: villageId },
    schema: getSentReinforcementsByVillageSchema,
  });

  return mapSentReinforcements(rows);
});

export const relocateReinforcements = createController(
  '/villages/:villageId/relocate-reinforcements',
  'post',
  {
    summary: 'Relocate reinforcements to the current village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: relocateReinforcementsSchema,
  },
)(({ database, path: { villageId }, body: { sourceTileId, troops } }) => {
  database.transaction((db) => {
    const { sourceVillageId, currentVillageTile } = db.selectObject({
      sql: selectSourceVillageByTileAndCurrentVillageQuery,
      bind: {
        $source_tile_id: sourceTileId,
        $village_id: villageId,
      },
      schema: sourceVillageRowSchema,
    })!;

    if (sourceVillageId === null) {
      throw new Error('Source village not found');
    }

    moveStationedTroops(
      db,
      troops,
      { tileId: currentVillageTile, source: sourceTileId },
      { tileId: currentVillageTile, source: currentVillageTile },
    );

    if (hasHero(troops)) {
      relocateHero(db, sourceVillageId, villageId, Date.now());
    }
  });
});

export const returnReinforcements = createController(
  '/villages/:villageId/return-reinforcements',
  'post',
  {
    summary: 'Return reinforcements to their source village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: returnReinforcementsSchema,
  },
)(({ database, path: { villageId }, body: { sourceTileId, troops } }) => {
  database.transaction((db) => {
    const { sourceVillageId, currentVillageTile } = db.selectObject({
      sql: selectSourceVillageByTileAndCurrentVillageQuery,
      bind: {
        $source_tile_id: sourceTileId,
        $village_id: villageId,
      },
      schema: sourceVillageRowSchema,
    })!;

    if (sourceVillageId === null) {
      throw new Error('Source village not found');
    }

    returnStationedTroops(
      db,
      sourceVillageId,
      currentVillageTile,
      sourceTileId,
      sourceTileId,
      troops,
    );
  });
});

export const returnSentReinforcements = createController(
  '/villages/:villageId/return-sent-reinforcements',
  'post',
  {
    summary: 'Return sent reinforcements to the current village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: returnSentReinforcementsSchema,
  },
)(({ database, path: { villageId }, body: { stationedTileId, troops } }) => {
  database.transaction((db) => {
    const { currentVillageTile } = db.selectObject({
      sql: selectVillageTileQuery,
      bind: {
        $village_id: villageId,
      },
      schema: villageTileRowSchema,
    })!;

    returnStationedTroops(
      db,
      villageId,
      stationedTileId,
      currentVillageTile,
      currentVillageTile,
      troops,
    );
  });
});

export const relocateSentReinforcements = createController(
  '/villages/:villageId/relocate-sent-reinforcements',
  'post',
  {
    summary: 'Relocate sent reinforcements to their stationed village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: relocateSentReinforcementsSchema,
  },
)(({ database, path: { villageId }, body: { stationedTileId, troops } }) => {
  database.transaction((db) => {
    const { currentVillageTile, stationedVillageId } = db.selectObject({
      sql: selectStationedVillageByTileAndCurrentVillageQuery,
      bind: {
        $stationed_tile_id: stationedTileId,
        $village_id: villageId,
      },
      schema: stationedVillageRowSchema,
    })!;

    if (stationedVillageId === null) {
      throw new Error('Stationed village not found');
    }

    moveStationedTroops(
      db,
      troops,
      { tileId: stationedTileId, source: currentVillageTile },
      { tileId: stationedTileId, source: stationedTileId },
    );

    if (hasHero(troops)) {
      relocateHero(db, villageId, stationedVillageId, Date.now());
    }
  });
});
