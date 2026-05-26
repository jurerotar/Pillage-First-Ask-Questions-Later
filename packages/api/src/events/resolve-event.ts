import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from '../utils/zod/event-schemas';
import { postWorkerMessage } from '../worker/notification-port';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
} from './resolvers/building-resolvers';
import {
  heroHealthRegenerationResolver,
  heroRevivalResolver,
} from './resolvers/hero-resolvers';
import { loyaltyIncreaseResolver } from './resolvers/loyalty-resolvers';
import {
  adventureMovementResolver,
  attackMovementResolver,
  findNewVillageMovementResolver,
  oasisOccupationMovementResolver,
  raidMovementResolver,
  reinforcementMovementResolver,
  relocationMovementResolver,
  returnMovementResolver,
} from './resolvers/troop-movement-resolver';
import { troopTrainingEventResolver } from './resolvers/troop-resolvers';
import { unitImprovementResolver } from './resolvers/unit-improvement-resolvers';
import { unitResearchResolver } from './resolvers/unit-research-resolvers';

export const getGameEventResolver = (gameEventType: GameEventType) => {
  switch (gameEventType) {
    case 'buildingLevelChange': {
      return buildingLevelChangeResolver;
    }
    case 'buildingConstruction': {
      return buildingConstructionResolver;
    }
    case 'buildingDestruction': {
      return buildingDestructionResolver;
    }
    case 'buildingScheduledConstruction': {
      return buildingScheduledConstructionEventResolver;
    }
    case 'troopTraining': {
      return troopTrainingEventResolver;
    }
    case 'troopMovementReinforcements': {
      return reinforcementMovementResolver;
    }
    case 'troopMovementRelocation': {
      return relocationMovementResolver;
    }
    case 'troopMovementReturn': {
      return returnMovementResolver;
    }
    case 'troopMovementFindNewVillage': {
      return findNewVillageMovementResolver;
    }
    case 'troopMovementAttack': {
      return attackMovementResolver;
    }
    case 'troopMovementRaid': {
      return raidMovementResolver;
    }
    case 'troopMovementOasisOccupation': {
      return oasisOccupationMovementResolver;
    }
    case 'troopMovementAdventure': {
      return adventureMovementResolver;
    }
    case 'heroRevival': {
      return heroRevivalResolver;
    }
    case 'heroHealthRegeneration': {
      return heroHealthRegenerationResolver;
    }
    case 'loyaltyIncrease': {
      return loyaltyIncreaseResolver;
    }
    case 'unitResearch': {
      return unitResearchResolver;
    }
    case 'unitImprovement': {
      return unitImprovementResolver;
    }
    default: {
      console.error(`No resolver function set for event type ${gameEventType}`);

      return () => {};
    }
  }
};

export const resolveEvent = (
  database: DbFacade,
  eventId: GameEvent['id'],
): void => {
  const eventRow = database.selectObject({
    sql: `
      DELETE
      FROM
        events
      WHERE
        id = $id
      RETURNING id, type, starts_at, duration, village_id, resolves_at, meta;
    `,
    bind: { $id: eventId },
    schema: baseEventRowSchema,
  })!;

  const event = mapEventRowToTypedEvent(eventRow);

  try {
    const resolver = getGameEventResolver(event.type);
    (resolver as (db: DbFacade, ev: GameEvent) => void)(database, event);

    postWorkerMessage({
      eventKey: 'event:success',
      ...event,
    } satisfies EventApiNotificationEvent);
  } catch (error) {
    console.error(error);
    postWorkerMessage({
      eventKey: 'event:error',
      ...event,
    } satisfies EventApiNotificationEvent);
  }
};
