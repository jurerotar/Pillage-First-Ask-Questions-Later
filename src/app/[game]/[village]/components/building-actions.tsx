import { assessBuildingConstructionReadiness } from 'app/[game]/[village]/utils/building-requirements';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useCreateEvent, useEvents } from 'app/[game]/hooks/use-events';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { getBuildingDataForLevel, specialFieldIds } from 'app/[game]/utils/building';
import { Button } from 'app/components/buttons/button';
import { GameEventType } from 'interfaces/models/events/game-event';
import type { Building } from 'interfaces/models/game/building';
import type React from 'react';
import { useNavigate } from 'react-router-dom';

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingActions: React.FC<BuildingCardProps> = ({ buildingId }) => {
  const navigate = useNavigate();
  const { tribe } = useTribe();
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { currentVillageBuildingEvents } = useEvents();
  const createBuildingConstructionEvent = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);
  const createBuildingLevelChangeEvent = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const createBuildingDestructionEvent = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);

  const buildingLevel = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)?.level ?? 0;
  const { building } = getBuildingDataForLevel(buildingId, buildingLevel);

  const doesBuildingExist = buildingLevel > 0 || specialFieldIds.includes(buildingFieldId!);
  const canDemolishBuildings = (currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0) >= 10;

  const { canBuild } = assessBuildingConstructionReadiness({
    buildingId,
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
  });

  const constructBuilding = () => {
    createBuildingConstructionEvent({
      buildingFieldId: buildingFieldId!,
      building,
      resolvesAt: Date.now(),
      resourceCost: building.buildingCost[0],
    });

    createBuildingLevelChangeEvent({
      buildingFieldId: buildingFieldId!,
      level: 1,
      resolvesAt: Date.now() + 5000,
      building,
      // Cost can be 0, since it's already accounted for in the construction event
      resourceCost: [0, 0, 0, 0],
    });

    navigate('..');
  };

  const upgradeBuilding = () => {
    const level = buildingLevel + 1;

    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 5000,
      buildingFieldId: buildingFieldId!,
      level,
      building,
      resourceCost: building.buildingCost[level],
    });

    navigate('..');
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 5000,
      buildingFieldId: buildingFieldId!,
      level: buildingLevel - 1,
      building,
      resourceCost: [0, 0, 0, 0],
    });

    navigate('..');
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      resolvesAt: Date.now() + 5000,
      buildingFieldId: buildingFieldId!,
      building,
    });

    navigate('..');
  };

  return (
    <section className="flex flex-col gap-4 py-2 justify-center">
      {doesBuildingExist && (
        <>
          <Button
            variant="confirm"
            onClick={upgradeBuilding}
          >
            Upgrade to level {buildingLevel + 1}
          </Button>
          {canDemolishBuildings && (
            <>
              {buildingLevel > 1 && (
                <Button
                  variant="confirm"
                  onClick={downgradeBuilding}
                >
                  Downgrade by 1 level
                </Button>
              )}
              <Button
                variant="confirm"
                onClick={demolishBuilding}
              >
                Demolish completely
              </Button>
            </>
          )}
        </>
      )}
      {!doesBuildingExist && canBuild && (
        <Button
          variant="confirm"
          onClick={constructBuilding}
        >
          Construct
        </Button>
      )}
    </section>
  );
};
