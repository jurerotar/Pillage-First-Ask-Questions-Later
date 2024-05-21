import { type AssessedBuildingRequirement, assessBuildingConstructionReadiness } from 'app/[game]/[village]/utils/building-requirements';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useCreateEvent, useEvents } from 'app/[game]/hooks/use-events';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { getBuildingData } from 'app/[game]/utils/common';
import { Button } from 'app/components/buttons/button';
import clsx from 'clsx';
import { GameEventType } from 'interfaces/models/events/game-event';
import type { Building } from 'interfaces/models/game/building';
import type { BuildingField } from 'interfaces/models/game/village';
import React from 'react';
import { useTranslation } from 'react-i18next';

type BuildingCardProps = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
};

export const BuildingCard: React.FC<BuildingCardProps> = ({ buildingId, buildingFieldId }) => {
  const { t } = useTranslation();
  const { tribe } = useTribe();
  const { playerVillages } = useVillages();
  const { currentVillage, canDemolishBuildings } = useCurrentVillage();
  const { currentVillageBuildingEvents } = useEvents();
  const createBuildingConstructionEvent = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);
  const createBuildingLevelChangeEvent = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const createBuildingDestructionEvent = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);

  const { events } = useEvents();

  console.log(events);

  const building = getBuildingData(buildingId);
  const buildingLevel = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)?.level ?? 0;
  const doesBuildingExist = !!building;

  const { canBuild, assessedRequirements } = assessBuildingConstructionReadiness({
    buildingId,
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
  });

  const constructBuilding = () => {
    createBuildingConstructionEvent({
      buildingFieldId,
      building,
      resolvesAt: Date.now(),
      resourceCost: building.buildingCost[0],
    });

    createBuildingLevelChangeEvent({
      buildingFieldId,
      level: 1,
      resolvesAt: Date.now() + 5000,
      building,
      // Cost can be 0, since it's already accounted for in the construction event
      resourceCost: [0, 0, 0, 0],
    });
  };

  const upgradeBuilding = () => {
    const level = buildingLevel + 1;

    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 500,
      buildingFieldId,
      level,
      building,
      resourceCost: building.buildingCost[level],
    });
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 5000,
      buildingFieldId,
      level: buildingLevel - 1,
      building,
      resourceCost: [0, 0, 0, 0],
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      resolvesAt: Date.now() + 5000,
      buildingFieldId,
      building,
    });
  };

  return (
    <article className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">{t(`BUILDINGS.${building.id}.NAME`)}</h2>
        <p>{t(`BUILDINGS.${building.id}.DESCRIPTION`)}</p>
      </div>
      <div className="" />
      {canBuild && (
        <div className="flex gap-2">
          {doesBuildingExist && (
            <>
              <Button
                variant="confirm"
                onClick={upgradeBuilding}
              >
                Upgrade
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
          {!doesBuildingExist && (
            <Button
              variant="confirm"
              onClick={constructBuilding}
            >
              Construct
            </Button>
          )}
        </div>
      )}
      {/* Show building requirements if building can't be built */}
      {!canBuild && (
        <section>
          Requirements
          <ul className="flex gap-2">
            {assessedRequirements.map((assessedRequirement: AssessedBuildingRequirement, index) => (
              <React.Fragment key={assessedRequirement.id}>
                {['capital', 'building'].includes(assessedRequirement.type) && (
                  <li>
                    <span className={clsx(assessedRequirement.fulfilled && 'line-through')}>
                      {assessedRequirement.type === 'capital' && 'Capital'}
                      {assessedRequirement.type === 'building' &&
                        `${t(`BUILDINGS.${assessedRequirement.buildingId}.NAME`)} level ${assessedRequirement.level}`}
                      {index !== assessedRequirements.length - 1 && ','}
                    </span>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};
