import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  sentReinforcementDtoSchema,
  villageTroopDtoSchema,
  woundedTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import { playerSchema } from '@pillage-first/types/models/player';
import {
  selectPlayerByIdQuery,
  selectPlayerBySlugQuery,
  selectPlayerVillageListingQuery,
  selectPlayerVillagesWithPopulationQuery,
  selectSentReinforcementsByTileQuery,
  selectSourceVillageByTileAndCurrentTileQuery,
  selectStationedTroopsByTileQuery,
  selectStationedVillageByTileAndCurrentTileQuery,
  selectWoundedTroopsByVillageQuery,
  updateVillageNameQuery,
} from '../../queries/player-queries';
import { relocateHero } from '../../utils/hero';
import {
  hasHero,
  moveStationedTroops,
  moveTroopWheatConsumption,
  type ReinforcementTroopSelection,
  removeStationedTroops,
  returnStationedTroops,
} from '../../utils/reinforcements';
import { materializeWoundedTroopsAt } from '../../utils/troops';
import { createController } from '../controller';
import {
  mapPlayerVillage,
  mapPlayerVillageWithPopulation,
  mapSentReinforcements,
  mapVillageTroop,
  mapWoundedTroop,
} from './mappers/player-mapper';
import {
  getPlayerVillagesWithPopulationSchema,
  getSentReinforcementsByTileSchema,
  getStationedTroopsByTileSchema,
  getVillagesByPlayerSchema,
  getWoundedTroopsByVillageSchema,
  relocateReinforcementsSchema,
  relocateSentReinforcementsSchema,
  returnReinforcementsSchema,
  returnSentReinforcementsSchema,
  sourceVillageRowSchema,
  stationedVillageRowSchema,
} from './schemas/player-schemas';

const isAnimalTroop = ({ unitId }: ReinforcementTroopSelection) => {
  return getUnitDefinition(unitId).tribe === 'nature';
};

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

export const getStationedTroopsByTile = createController(
  '/tiles/:tileId/stationed-troops',
  {
    summary: 'Get stationed troops by tile',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    response: z.array(villageTroopDtoSchema),
  },
)(({ database, path: { tileId } }) => {
  const rows = database.selectObjects({
    sql: selectStationedTroopsByTileQuery,
    bind: { $tile_id: tileId },
    schema: getStationedTroopsByTileSchema,
  });

  return rows.map(mapVillageTroop);
});

export const getWoundedTroopsByVillage = createController(
  '/villages/:villageId/wounded-troops',
  {
    summary: 'Get wounded troops by village',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(woundedTroopDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  materializeWoundedTroopsAt(database, villageId, Date.now());

  const rows = database.selectObjects({
    sql: selectWoundedTroopsByVillageQuery,
    bind: { $village_id: villageId },
    schema: getWoundedTroopsByVillageSchema,
  });

  return rows.map(mapWoundedTroop);
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

export const getSentReinforcementsByTile = createController(
  '/tiles/:tileId/sent-reinforcements',
  {
    summary: 'Get sent reinforcements by tile',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    response: z.array(sentReinforcementDtoSchema),
  },
)(({ database, path: { tileId } }) => {
  const rows = database.selectObjects({
    sql: selectSentReinforcementsByTileQuery,
    bind: { $tile_id: tileId },
    schema: getSentReinforcementsByTileSchema,
  });

  return mapSentReinforcements(rows);
});

export const relocateReinforcements = createController(
  '/tiles/:tileId/relocate-reinforcements',
  'post',
  {
    summary: 'Relocate reinforcements to the current village',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    requestBody: relocateReinforcementsSchema,
  },
)(({ database, path: { tileId }, body: { sourceTileId, troops } }) => {
  database.transaction((db) => {
    const { currentTileId, currentVillageId, sourceTileType, sourceVillageId } =
      db.selectObject({
        sql: selectSourceVillageByTileAndCurrentTileQuery,
        bind: {
          $source_tile_id: sourceTileId,
          $current_tile_id: tileId,
        },
        schema: sourceVillageRowSchema,
      })!;

    if (sourceTileType === 'oasis') {
      throw new Error('Reinforcements from oases cannot be relocated');
    }

    if (sourceVillageId === null) {
      throw new Error('Source village not found');
    }

    moveStationedTroops(
      db,
      troops,
      { tileId: currentTileId, source: sourceTileId },
      { tileId: currentTileId, source: currentTileId },
    );

    if (hasHero(troops)) {
      relocateHero(db, sourceVillageId, currentVillageId, Date.now());
    }
  });
});

export const returnReinforcements = createController(
  '/tiles/:tileId/return-reinforcements',
  'post',
  {
    summary: 'Return reinforcements to their source village',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    requestBody: returnReinforcementsSchema,
  },
)(({ database, path: { tileId }, body: { sourceTileId, troops } }) => {
  database.transaction((db) => {
    const { currentTileId, currentVillageId, sourceVillageId } =
      db.selectObject({
        sql: selectSourceVillageByTileAndCurrentTileQuery,
        bind: {
          $source_tile_id: sourceTileId,
          $current_tile_id: tileId,
        },
        schema: sourceVillageRowSchema,
      })!;

    const animalTroops = troops.filter(isAnimalTroop);
    const returningTroops = troops.filter((troop) => !isAnimalTroop(troop));

    if (animalTroops.length > 0) {
      removeStationedTroops(db, animalTroops, {
        tileId: currentTileId,
        source: sourceTileId,
      });
    }

    if (returningTroops.length === 0) {
      return;
    }

    if (sourceVillageId === null) {
      throw new Error('Source village not found');
    }

    const now = Date.now();

    returnStationedTroops(
      db,
      sourceVillageId,
      currentTileId,
      sourceTileId,
      sourceTileId,
      returningTroops,
      now,
    );

    moveTroopWheatConsumption(
      db,
      returningTroops,
      currentVillageId,
      sourceVillageId,
      now,
    );
  });
});

export const returnSentReinforcements = createController(
  '/tiles/:tileId/return-sent-reinforcements',
  'post',
  {
    summary: 'Return sent reinforcements to the current village',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    requestBody: returnSentReinforcementsSchema,
  },
)(({ database, path: { tileId }, body: { stationedTileId, troops } }) => {
  database.transaction((db) => {
    const {
      currentTileId,
      currentVillageId,
      stationedTileType,
      stationedVillageId,
    } = db.selectObject({
      sql: selectStationedVillageByTileAndCurrentTileQuery,
      bind: {
        $stationed_tile_id: stationedTileId,
        $current_tile_id: tileId,
      },
      schema: stationedVillageRowSchema,
    })!;

    if (stationedVillageId === null) {
      throw new Error('Stationed tile not found');
    }

    const now = Date.now();

    returnStationedTroops(
      db,
      currentVillageId,
      stationedTileId,
      currentTileId,
      currentTileId,
      troops,
      now,
    );

    if (stationedTileType !== 'oasis') {
      moveTroopWheatConsumption(
        db,
        troops,
        stationedVillageId,
        currentVillageId,
        now,
      );
    }
  });
});

export const relocateSentReinforcements = createController(
  '/tiles/:tileId/relocate-sent-reinforcements',
  'post',
  {
    summary: 'Relocate sent reinforcements to their stationed village',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    requestBody: relocateSentReinforcementsSchema,
  },
)(({ database, path: { tileId }, body: { stationedTileId, troops } }) => {
  database.transaction((db) => {
    const {
      currentTileId,
      currentVillageId,
      stationedTileType,
      stationedVillageId,
    } = db.selectObject({
      sql: selectStationedVillageByTileAndCurrentTileQuery,
      bind: {
        $stationed_tile_id: stationedTileId,
        $current_tile_id: tileId,
      },
      schema: stationedVillageRowSchema,
    })!;

    if (stationedVillageId === null) {
      throw new Error('Stationed village not found');
    }

    if (stationedTileType === 'oasis') {
      throw new Error('Relocations cannot be sent to oases');
    }

    moveStationedTroops(
      db,
      troops,
      { tileId: stationedTileId, source: currentTileId },
      { tileId: stationedTileId, source: stationedTileId },
    );

    if (hasHero(troops)) {
      relocateHero(db, currentVillageId, stationedVillageId, Date.now());
    }
  });
});
