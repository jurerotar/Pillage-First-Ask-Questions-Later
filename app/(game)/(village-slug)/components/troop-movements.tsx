import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Village } from 'app/interfaces/models/game/village';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { IconType } from 'app/components/icons/icons';
import { Icon } from 'app/components/icon';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Separator } from 'app/components/ui/separator';
import { clsx } from 'clsx';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Suspense } from 'react';

type TroopMovementProps = {
  type: Extract<
    IconType,
    | 'deploymentOutgoing'
    | 'deploymentIncoming'
    | 'offensiveMovementOutgoing'
    | 'offensiveMovementIncoming'
    | 'adventure'
    | 'findNewVillage'
  >;
  events: GameEvent<'troopMovement'>[];
};

const TroopMovement = ({ type, events }: TroopMovementProps) => {
  if (events.length === 0) {
    return null;
  }

  const earliestEvent = events[0];

  return (
    <div className="inline-flex gap-1 bg-background border-2 border-l-0 items-center rounded-r-xs border-white/80 py-0.5 px-2 lg:py-2 shadow-sm font-semibold text-xs lg:text-base">
      <span className="inline-flex gap-2 min-w-16">
        <Icon
          type={type}
          className={clsx(
            type === 'offensiveMovementIncoming' && 'animate-scale-pulse',
          )}
        />
        <Countdown endsAt={earliestEvent.startsAt + earliestEvent.duration} />
      </span>
      <Separator orientation="vertical" />
      <span className="inline-flex min-w-4 lg:min-w-6 justify-end">
        {events.length > 9 ? '9+' : events.length}
      </span>
    </div>
  );
};

const partitionTroopMovementEvents = (
  events: GameEvent<'troopMovement'>[],
  currentVillageId: Village['id'],
) => {
  // Raid, attack, oasis-occupation
  const outgoingOffensiveMovementEvents: GameEvent<'troopMovement'>[] = [];
  // Relocation, reinforcement
  const outgoingDeploymentMovementEvents: GameEvent<'troopMovement'>[] = [];
  // Raid, attack
  const incomingOffensiveMovementEvents: GameEvent<'troopMovement'>[] = [];
  // Relocation, reinforcement, return
  const incomingDeploymentMovementEvents: GameEvent<'troopMovement'>[] = [];
  const adventureMovementEvents: GameEvent<'troopMovement'>[] = [];
  const findNewVillageMovementEvents: GameEvent<'troopMovement'>[] = [];

  for (const event of events) {
    switch (event.movementType) {
      case 'find-new-village': {
        findNewVillageMovementEvents.push(event);
        break;
      }
      case 'adventure': {
        adventureMovementEvents.push(event);
        break;
      }
      case 'reinforcements':
      case 'relocation':
      case 'return': {
        const target =
          currentVillageId === event.targetId
            ? incomingDeploymentMovementEvents
            : outgoingDeploymentMovementEvents;
        target.push(event);
        break;
      }
      case 'attack':
      case 'raid': {
        const target =
          currentVillageId === event.targetId
            ? incomingOffensiveMovementEvents
            : outgoingOffensiveMovementEvents;
        target.push(event);
        break;
      }
      case 'oasis-occupation': {
        outgoingOffensiveMovementEvents.push(event);
        break;
      }
    }
  }

  return {
    outgoingOffensiveMovementEvents,
    outgoingDeploymentMovementEvents,
    incomingOffensiveMovementEvents,
    incomingDeploymentMovementEvents,
    adventureMovementEvents,
    findNewVillageMovementEvents,
  };
};

const TroopMovementsContent = () => {
  const { currentVillage } = useCurrentVillage();
  const { shouldShowSidebars } = useGameLayoutState();
  const { eventsByType: troopMovementEvents } =
    useEventsByType('troopMovement');

  if (!shouldShowSidebars) {
    return null;
  }

  const {
    findNewVillageMovementEvents,
    outgoingOffensiveMovementEvents,
    incomingOffensiveMovementEvents,
    outgoingDeploymentMovementEvents,
    incomingDeploymentMovementEvents,
    adventureMovementEvents,
  } = partitionTroopMovementEvents(troopMovementEvents, currentVillage.id);

  return (
    <div className="flex flex-col gap-1 lg:gap-2 fixed left-0 top-29 lg:top-40 z-20">
      <TroopMovement
        type="findNewVillage"
        events={findNewVillageMovementEvents}
      />
      <TroopMovement
        type="adventure"
        events={adventureMovementEvents}
      />
      <TroopMovement
        type="deploymentOutgoing"
        events={outgoingDeploymentMovementEvents}
      />
      <TroopMovement
        type="deploymentIncoming"
        events={incomingDeploymentMovementEvents}
      />
      <TroopMovement
        type="offensiveMovementOutgoing"
        events={outgoingOffensiveMovementEvents}
      />
      <TroopMovement
        type="offensiveMovementIncoming"
        events={incomingOffensiveMovementEvents}
      />
    </div>
  );
};

export const TroopMovements = () => {
  return (
    <Suspense fallback={null}>
      <TroopMovementsContent />
    </Suspense>
  );
};
