import React from 'react';
import { Building } from 'interfaces/models/game/building';
import { useCreateEvent, useEvents } from 'app/[game]/hooks/use-events';
import { BuildingField } from 'interfaces/models/game/village';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { GameEventType } from 'interfaces/models/events/game-event';
import { getBuildingData } from 'app/[game]/utils/common';
import { useTranslation } from 'react-i18next';
import { Button } from 'app/components/buttons/button';
import { assessBuildingConstructionReadiness, AssessedBuildingRequirement } from 'app/[game]/[village]/utils/building-requirements';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { useVillages } from 'app/[game]/hooks/use-villages';
import clsx from 'clsx';

type BuildingCardProps = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
};

export const BuildingCard: React.FC<BuildingCardProps> = ({ buildingId, buildingFieldId }) => {
  const { t } = useTranslation();
  const { tribe } = useTribe();
  const { playerVillages } = useVillages();
  const { currentVillage, currentVillageId, canDemolishBuildings } = useCurrentVillage();
  const { currentVillageBuildingEvents } = useEvents();
  const createBuildingConstructionEvent = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);
  const createBuildingLevelChangeEvent = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const createBuildingDestructionEvent = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);

  const building = getBuildingData(buildingId);
  const buildingLevel = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)?.level ?? 0;
  const doesBuildingExist = buildingLevel > 0;

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
      villageId: currentVillageId,
      resolvesAt: Date.now(),
    });

    createBuildingLevelChangeEvent({
      buildingFieldId,
      level: 1,
      villageId: currentVillageId,
      resolvesAt: Date.now() + 5000,
      building,
    });
  };

  const upgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 500,
      villageId: currentVillageId,
      buildingFieldId,
      level: buildingLevel + 1,
      building,
    });
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 5000,
      villageId: currentVillageId,
      buildingFieldId,
      level: buildingLevel - 1,
      building,
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      resolvesAt: Date.now() + 5000,
      villageId: currentVillageId,
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
                Construct
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
