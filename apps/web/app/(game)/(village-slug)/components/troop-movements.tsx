import { clsx } from 'clsx';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router';
import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import type { Village } from '@pillage-first/types/models/village';
import {
  isAdventureTroopMovementEvent,
  isAttackTroopMovementEvent,
  isFindNewVillageTroopMovementEvent,
  isOasisOccupationTroopMovementEvent,
  isRaidTroopMovementEvent,
  isReinforcementsTroopMovementEvent,
  isRelocationTroopMovementEvent,
  isReturnTroopMovementEvent,
} from '@pillage-first/utils/guards/event';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';
import { Separator } from 'app/components/ui/separator';

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
  events: TroopMovementEvent[];
  href?: string;
};

const TroopMovement = ({ type, events, href }: TroopMovementProps) => {
  if (events.length === 0) {
    return null;
  }

  const [earliestEvent] = events;

  const content = (
    <div className="inline-flex gap-1 bg-background border-2 border-l-0 items-center rounded-r-xs border-white/80 dark:border-border/80 py-0.5 px-2 lg:py-1 shadow-sm font-semibold text-xs lg:text-base transition-colors">
      <span className="inline-flex gap-2 min-w-16">
        <Icon
          type={type}
          shouldShowTooltip={false}
          className={clsx(
            'size-4 lg:size-6',
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

  if (href) {
    return (
      <Link
        to={href}
        relative="path"
      >
        {content}
      </Link>
    );
  }

  return content;
};

const partitionTroopMovementEvents = (
  events: TroopMovementEvent[],
  currentVillageCoordinates: Village['coordinates'],
) => {
  // Raid, attack, oasis-occupation
  const outgoingOffensiveMovementEvents: TroopMovementEvent[] = [];
  // Relocation, reinforcement
  const outgoingDeploymentMovementEvents: TroopMovementEvent[] = [];
  // Raid, attack
  const incomingOffensiveMovementEvents: TroopMovementEvent[] = [];
  // Relocation, reinforcement, return
  const incomingDeploymentMovementEvents: TroopMovementEvent[] = [];
  const adventureMovementEvents: TroopMovementEvent[] = [];
  const findNewVillageMovementEvents: TroopMovementEvent[] = [];

  for (const event of events) {
    if (isFindNewVillageTroopMovementEvent(event)) {
      findNewVillageMovementEvents.push(event);
      continue;
    }
    if (isAdventureTroopMovementEvent(event)) {
      adventureMovementEvents.push(event);
      continue;
    }
    if (
      isReinforcementsTroopMovementEvent(event) ||
      isRelocationTroopMovementEvent(event) ||
      isReturnTroopMovementEvent(event)
    ) {
      const isIncoming =
        currentVillageCoordinates.x === event.targetCoordinates.x &&
        currentVillageCoordinates.y === event.targetCoordinates.y;

      const target = isIncoming
        ? incomingDeploymentMovementEvents
        : outgoingDeploymentMovementEvents;
      target.push(event);
      continue;
    }
    if (isAttackTroopMovementEvent(event) || isRaidTroopMovementEvent(event)) {
      const isIncoming =
        currentVillageCoordinates.x === event.targetCoordinates.x &&
        currentVillageCoordinates.y === event.targetCoordinates.y;

      const target = isIncoming
        ? incomingOffensiveMovementEvents
        : outgoingOffensiveMovementEvents;
      target.push(event);
      continue;
    }
    if (isOasisOccupationTroopMovementEvent(event)) {
      outgoingOffensiveMovementEvents.push(event);
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
  const { eventsByType: troopMovementEvents } =
    useEventsByType('troopMovement');

  const {
    findNewVillageMovementEvents,
    outgoingOffensiveMovementEvents,
    incomingOffensiveMovementEvents,
    outgoingDeploymentMovementEvents,
    incomingDeploymentMovementEvents,
    adventureMovementEvents,
  } = partitionTroopMovementEvents(
    troopMovementEvents,
    currentVillage.coordinates,
  );

  const rallyPoint = useMemo(() => {
    return currentVillage.buildingFields.find((field) => field.id === 39);
  }, [currentVillage.buildingFields]);

  const rallyPointLink = useMemo(() => {
    return rallyPoint && rallyPoint.level >= 1
      ? 'village/39?tab=troop-movements'
      : undefined;
  }, [rallyPoint]);

  return (
    <aside className="flex flex-col gap-1 lg:gap-2 fixed left-0 top-30 lg:top-40 z-20">
      <TroopMovement
        type="findNewVillage"
        events={findNewVillageMovementEvents}
        href={rallyPointLink}
      />
      <TroopMovement
        type="adventure"
        events={adventureMovementEvents}
        href={rallyPointLink}
      />
      <TroopMovement
        type="deploymentOutgoing"
        events={outgoingDeploymentMovementEvents}
        href={rallyPointLink}
      />
      <TroopMovement
        type="deploymentIncoming"
        events={incomingDeploymentMovementEvents}
        href={rallyPointLink}
      />
      <TroopMovement
        type="offensiveMovementOutgoing"
        events={outgoingOffensiveMovementEvents}
        href={rallyPointLink}
      />
      <TroopMovement
        type="offensiveMovementIncoming"
        events={incomingOffensiveMovementEvents}
        href={rallyPointLink}
      />
    </aside>
  );
};

export const TroopMovements = () => {
  const { shouldShowSidebars } = useGameLayoutState();

  if (!shouldShowSidebars) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <TroopMovementsContent />
    </Suspense>
  );
};
