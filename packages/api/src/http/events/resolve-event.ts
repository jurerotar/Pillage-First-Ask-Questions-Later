import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from '../../utils/zod/event-schemas';
import { postWorkerMessage } from '../../worker/notification-port';
import type { Resolver } from './resolver';
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

type GameEventResolverMap = {
  [TEventType in GameEventType]: Resolver<GameEvent<TEventType>>;
};

const gameEventResolvers = {
  buildingLevelChange: buildingLevelChangeResolver,
  buildingConstruction: buildingConstructionResolver,
  buildingDestruction: buildingDestructionResolver,
  buildingScheduledConstruction: buildingScheduledConstructionEventResolver,
  troopTraining: troopTrainingEventResolver,
  troopMovementReinforcements: reinforcementMovementResolver,
  troopMovementRelocation: relocationMovementResolver,
  troopMovementReturn: returnMovementResolver,
  troopMovementFindNewVillage: findNewVillageMovementResolver,
  troopMovementAttack: attackMovementResolver,
  troopMovementRaid: raidMovementResolver,
  troopMovementOasisOccupation: oasisOccupationMovementResolver,
  troopMovementAdventure: adventureMovementResolver,
  heroRevival: heroRevivalResolver,
  heroHealthRegeneration: heroHealthRegenerationResolver,
  loyaltyIncrease: loyaltyIncreaseResolver,
  unitResearch: unitResearchResolver,
  unitImprovement: unitImprovementResolver,
} satisfies GameEventResolverMap;

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
    const resolver = gameEventResolvers[event.type];
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
