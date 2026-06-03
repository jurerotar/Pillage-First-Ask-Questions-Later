import { clsx } from 'clsx';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { useVillageTroopMovements } from 'app/(game)/(village-slug)/hooks/use-village-troop-movements';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';
import { Separator } from 'app/components/ui/separator';

type MovementEvent = {
  resolvesAt: number;
};

type TroopMovementProps = {
  type: Extract<
    IconType,
    | 'deploymentOutgoing'
    | 'deploymentIncoming'
    | 'offensiveMovementOutgoing'
    | 'offensiveMovementIncoming'
    | 'adventure'
    | 'findNewVillage'
    | 'huntingParty'
    | 'gatheringTrip'
  >;
  events: MovementEvent[];
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
        <Countdown endsAt={earliestEvent.resolvesAt} />
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

const HuntersLodgeHuntMovement = () => {
  const { currentVillage } = useCurrentVillage();
  const { eventsByType: huntersLodgeHuntEvents } =
    useEventsByType('huntersLodgeHunt');

  const huntersLodge = useMemo(() => {
    return currentVillage.buildingFields.find(
      (field) => field.buildingId === 'HUNTERS_LODGE',
    );
  }, [currentVillage.buildingFields]);

  const huntersLodgeLink = useMemo(() => {
    return huntersLodge && huntersLodge.level >= 1
      ? `village/${huntersLodge.id}?tab=hunting-party`
      : undefined;
  }, [huntersLodge]);

  if (huntersLodgeHuntEvents.length === 0) {
    return null;
  }

  return (
    <TroopMovement
      type="huntingParty"
      events={huntersLodgeHuntEvents}
      href={huntersLodgeLink}
    />
  );
};

const GatherersHutGatheringTripMovement = () => {
  const { currentVillage } = useCurrentVillage();
  const { eventsByType: gatherersHutGatheringTripEvents } = useEventsByType(
    'gatherersHutGatheringTrip',
  );

  const gatherersHut = useMemo(() => {
    return currentVillage.buildingFields.find(
      (field) => field.buildingId === 'GATHERERS_HUT',
    );
  }, [currentVillage.buildingFields]);

  const gatherersHutLink = useMemo(() => {
    return gatherersHut && gatherersHut.level >= 1
      ? `village/${gatherersHut.id}?tab=gathering-expedition`
      : undefined;
  }, [gatherersHut]);

  if (gatherersHutGatheringTripEvents.length === 0) {
    return null;
  }

  return (
    <TroopMovement
      type="gatheringTrip"
      events={gatherersHutGatheringTripEvents}
      href={gatherersHutLink}
    />
  );
};

const partitionTroopMovementEvents = (
  events: ReturnType<typeof useVillageTroopMovements>['troopMovements'],
  currentVillageId: number,
) => {
  // Raid, attack, oasis-occupation
  const outgoingOffensiveMovementEvents: typeof events = [];
  // Relocation, reinforcement
  const outgoingDeploymentMovementEvents: typeof events = [];
  // Raid, attack
  const incomingOffensiveMovementEvents: typeof events = [];
  // Relocation, reinforcement, return
  const incomingDeploymentMovementEvents: typeof events = [];
  const adventureMovementEvents: typeof events = [];
  const findNewVillageMovementEvents: typeof events = [];

  for (const event of events) {
    if (event.type === 'troopMovementFindNewVillage') {
      findNewVillageMovementEvents.push(event);
      continue;
    }
    if (event.type === 'troopMovementAdventure') {
      adventureMovementEvents.push(event);
      continue;
    }
    if (
      event.type === 'troopMovementReinforcements' ||
      event.type === 'troopMovementRelocation' ||
      event.type === 'troopMovementReturn'
    ) {
      const isIncoming = event.originatingVillageId !== currentVillageId;

      const target = isIncoming
        ? incomingDeploymentMovementEvents
        : outgoingDeploymentMovementEvents;
      target.push(event);
      continue;
    }
    if (
      event.type === 'troopMovementAttack' ||
      event.type === 'troopMovementRaid'
    ) {
      const isIncoming = event.originatingVillageId !== currentVillageId;

      const target = isIncoming
        ? incomingOffensiveMovementEvents
        : outgoingOffensiveMovementEvents;
      target.push(event);
      continue;
    }
    if (event.type === 'troopMovementOasisOccupation') {
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
  const { troopMovements } = useVillageTroopMovements();

  const {
    findNewVillageMovementEvents,
    outgoingOffensiveMovementEvents,
    incomingOffensiveMovementEvents,
    outgoingDeploymentMovementEvents,
    incomingDeploymentMovementEvents,
    adventureMovementEvents,
  } = partitionTroopMovementEvents(troopMovements, currentVillage.id);

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
      <HuntersLodgeHuntMovement />
      <GatherersHutGatheringTripMovement />
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
