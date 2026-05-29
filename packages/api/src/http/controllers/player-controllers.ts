import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  sentReinforcementDtoSchema,
  villageTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import { playerSchema } from '@pillage-first/types/models/player';
import type { Troop } from '@pillage-first/types/models/troop';
import {
  selectPlayerByIdQuery,
  selectPlayerBySlugQuery,
  selectPlayerVillageListingQuery,
  selectPlayerVillagesWithPopulationQuery,
  selectSentReinforcementsByVillageQuery,
  selectSourceVillageByTileAndCurrentVillageQuery,
  selectStationedVillageByTileAndCurrentVillageQuery,
  selectTileCoordinatesQuery,
  selectVillageTileQuery,
  selectVillageTroopsQuery,
  updateVillageNameQuery,
} from '../../queries/player-queries';
import { createEvents } from '../../utils/create-event';
import { relocateHero } from '../../utils/hero';
import { addTroops, removeTroops } from '../../utils/troops';
import { createController } from '../controller';
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
  relocateReinforcementsSchema,
  relocateSentReinforcementsSchema,
  returnReinforcementsSchema,
  returnSentReinforcementsSchema,
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

const villageTileRowSchema = z.strictObject({
  currentVillageTile: z.number(),
});

const sourceVillageRowSchema = z.strictObject({
  sourceVillageId: z.number(),
  currentVillageTile: z.number(),
});

const stationedVillageRowSchema = z.strictObject({
  currentVillageTile: z.number(),
  stationedVillageId: z.number().nullable(),
});

const coordinatesRowSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
});

const getCoordinatesByTileId = (
  database: Parameters<typeof createEvents>[0],
  tileId: number,
) => {
  return database.selectObject({
    sql: selectTileCoordinatesQuery,
    bind: { $tile_id: tileId },
    schema: coordinatesRowSchema,
  })!;
};

const toTroops = ({
  troops,
  tileId,
  source,
}: {
  troops: Array<Pick<Troop, 'unitId' | 'amount'>>;
  tileId: number;
  source: number;
}): Troop[] =>
  troops.map((troop) => ({
    ...troop,
    tileId,
    source,
  }));

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

    removeTroops(
      db,
      toTroops({
        troops,
        tileId: currentVillageTile,
        source: sourceTileId,
      }),
    );

    addTroops(
      db,
      toTroops({
        troops,
        tileId: currentVillageTile,
        source: currentVillageTile,
      }),
    );

    if (troops.some(({ unitId }) => unitId === 'HERO')) {
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

    const selectedTroops = toTroops({
      troops,
      tileId: currentVillageTile,
      source: sourceTileId,
    });

    removeTroops(db, selectedTroops);

    createEvents<'troopMovementReturn'>(db, {
      type: 'troopMovementReturn',
      villageId: sourceVillageId,
      originCoordinates: getCoordinatesByTileId(db, currentVillageTile),
      targetCoordinates: getCoordinatesByTileId(db, sourceTileId),
      originalMovementType: 'troopMovementReturnReinforcements',
      troops: selectedTroops,
    });
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

    const selectedTroops = toTroops({
      troops,
      tileId: stationedTileId,
      source: currentVillageTile,
    });

    removeTroops(db, selectedTroops);

    createEvents<'troopMovementReturn'>(db, {
      type: 'troopMovementReturn',
      villageId,
      originCoordinates: getCoordinatesByTileId(db, stationedTileId),
      targetCoordinates: getCoordinatesByTileId(db, currentVillageTile),
      originalMovementType: 'troopMovementReturnReinforcements',
      troops: selectedTroops,
    });
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

    removeTroops(
      db,
      toTroops({
        troops,
        tileId: stationedTileId,
        source: currentVillageTile,
      }),
    );

    addTroops(
      db,
      toTroops({
        troops,
        tileId: stationedTileId,
        source: stationedTileId,
      }),
    );

    if (troops.some(({ unitId }) => unitId === 'HERO')) {
      relocateHero(db, villageId, stationedVillageId, Date.now());
    }
  });
});
