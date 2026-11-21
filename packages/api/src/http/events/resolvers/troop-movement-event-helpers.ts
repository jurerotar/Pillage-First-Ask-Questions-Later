import { z } from 'zod';
import type { TroopMovementEventType } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateTravelDuration } from '@pillage-first/utils/game/troop-movement-duration';
import { selectUnitSpeedRelevantEffectsQuery } from '../../../queries/effect-queries';
import { selectHeroSpeedQuery } from '../../../queries/hero-queries';
import { selectServerMapSizeQuery } from '../../../queries/server-queries';
import { removeTroops, validateTroopMovement } from '../../../utils/troops';
import { apiEffectsJsonSchema } from '../../../utils/zod/effect-schemas';
import type { EventCreationArgs } from '../resolver';

export const getMovementDuration = (
  database: DbFacade,
  calculateDuration: () => number,
) => {
  const isInstantUnitTravelEnabled = database.selectValue({
    sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
    schema: z.coerce.boolean(),
  })!;

  if (isInstantUnitTravelEnabled) {
    return 0;
  }

  return calculateDuration();
};

export const getTravelDuration = (
  database: DbFacade,
  event: EventCreationArgs<TroopMovementEventType>,
) => {
  const { villageId, targetTileId, originTileId, troops } = event;

  const effects = database.selectValue({
    sql: selectUnitSpeedRelevantEffectsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: apiEffectsJsonSchema,
  })!;

  const mapSize = database.selectValue({
    sql: selectServerMapSizeQuery,
    schema: z.number(),
  })!;

  const heroSpeed = database.selectValue({
    sql: selectHeroSpeedQuery,
    schema: z.number(),
  })!;

  return calculateTravelDuration({
    targetTileId,
    originTileId,
    mapSize,
    troops,
    effects,
    heroSpeed,
  });
};

export const movementCreation = (
  database: DbFacade,
  event: EventCreationArgs<TroopMovementEventType>,
) => ({
  validate: (now: number) => {
    const errors = validateTroopMovement(database, event, now);

    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  },
  duration: () =>
    getMovementDuration(database, () => getTravelDuration(database, event)),
  afterInsert: () => {
    removeTroops(database, event.troops);
  },
});
