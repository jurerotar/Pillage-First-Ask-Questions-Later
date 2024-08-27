import { type AssessedBuildingRequirement, assessBuildingConstructionReadiness } from 'app/[game]/[village]/utils/building-requirements';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useCreateEvent, useEvents } from 'app/[game]/hooks/use-events';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { getBuildingDataForLevel, specialFieldIds } from 'app/[game]/utils/building';
import { Button } from 'app/components/buttons/button';
import { Icon, effectValueToIconVariant } from 'app/components/icon';
import { formatPercentage } from 'app/utils/common';
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
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEvents } = useEvents();
  const createBuildingConstructionEvent = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);
  const createBuildingLevelChangeEvent = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const createBuildingDestructionEvent = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);

  const canDemolishBuildings = (currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0) >= 10;
  const buildingLevel = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)?.level ?? 0;
  const { building, isMaxLevel, nextLevelCropConsumption, cumulativeCropConsumption, cumulativeEffects } = getBuildingDataForLevel(
    buildingId,
    buildingLevel,
  );

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
        {!doesBuildingExist && canBuild && (
          <Button
            variant="confirm"
            onClick={constructBuilding}
          >
            Construct
          </Button>
        )}
      </div>
      {/* Effects */}
      <section className="flex gap-4 justify-center">
        <div className="flex gap-2">
          <Icon
            type="population"
            className="size-6"
            variant="positive-change"
          />
          {!isMaxLevel && <span>{nextLevelCropConsumption}</span>}
          <span>({cumulativeCropConsumption})</span>
        </div>

        <div className="flex gap-2">
          {cumulativeEffects.map(({ effectId, cumulativeValue, nextLevelValue }) => (
            <div
              key={effectId}
              className="flex gap-2"
            >
              <Icon
                // @ts-ignore - TODO: Add missing icons
                type={effectId}
                className="size-6"
                variant={effectValueToIconVariant(nextLevelValue)}
              />
              {!isMaxLevel && <span>{Number.isInteger(nextLevelValue) ? nextLevelValue : formatPercentage(nextLevelValue)}</span>}
              <span>({Number.isInteger(cumulativeValue) ? cumulativeValue : formatPercentage(cumulativeValue)})</span>
            </div>
          ))}
        </div>
      </section>
      {/* Show building requirements if building can't be built */}
      {!doesBuildingExist && !canBuild && !specialFieldIds.includes(buildingFieldId) && (
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
