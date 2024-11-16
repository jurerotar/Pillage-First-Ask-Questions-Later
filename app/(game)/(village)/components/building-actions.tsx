import { useBuildingActions } from 'app/(game)/(village)/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/(game)/(village)/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { useCurrentResources } from 'app/(game)/providers/current-resources-provider';
import { getBuildingDataForLevel, specialFieldIds } from 'app/(game)/utils/building';
import { Button } from 'app/components/buttons/button';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingActions: React.FC<BuildingCardProps> = ({ buildingId }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_ACTIONS' });
  const navigate = useNavigate();
  const { tribe } = useTribe();
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { isDeveloperModeActive } = useDeveloperMode();
  const { currentVillageBuildingEvents, canAddAdditionalBuildingToQueue } = useEvents();
  const { wood, clay, iron, wheat } = useCurrentResources();
  const { constructBuilding, upgradeBuilding, downgradeBuilding, demolishBuilding } = useBuildingActions(buildingId, buildingFieldId!);
  const { buildingLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId!);
  const { nextLevelResourceCost, isMaxLevel } = getBuildingDataForLevel(buildingId, buildingLevel);

  const doesBuildingExist = buildingLevel > 0 || specialFieldIds.includes(buildingFieldId!);
  const canDemolishBuildings = (currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0) >= 10;

  const { canBuild } = assessBuildingConstructionReadiness({
    buildingId,
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
  });

  const hasEnoughResourcesToBuild = (() => {
    if (isDeveloperModeActive) {
      return true;
    }

    return (
      wood >= nextLevelResourceCost[0] &&
      clay >= nextLevelResourceCost[1] &&
      iron >= nextLevelResourceCost[2] &&
      wheat >= nextLevelResourceCost[3]
    );
  })();

  const onBuildingConstruction = () => {
    constructBuilding();
    navigate('..');
  };

  const onBuildingUpgrade = () => {
    upgradeBuilding();
    navigate('..');
  };

  const onBuildingDowngrade = () => {
    downgradeBuilding();
    navigate('..');
  };

  const onBuildingDemolish = () => {
    demolishBuilding();
    navigate('..');
  };

  if (doesBuildingExist) {
    if (isMaxLevel && !canDemolishBuildings) {
      return null;
    }

    return (
      <section
        data-testid="building-actions-section"
        className="flex flex-col gap-2 pt-2 border-t border-gray-200"
      >
        <h3 className="font-medium">{t('TITLE')}</h3>
        <div className="flex gap-4">
          {!isMaxLevel && (
            <Button
              data-testid="building-actions-upgrade-building-button"
              variant="confirm"
              onClick={onBuildingUpgrade}
              disabled={!(canAddAdditionalBuildingToQueue && hasEnoughResourcesToBuild)}
            >
              {t('UPGRADE_BUILDING', { level: buildingLevel + 1 })}
            </Button>
          )}
          {canDemolishBuildings && (
            <div className="flex gap-4 justify-center">
              {buildingLevel > 1 && (
                <Button
                  data-testid="building-actions-downgrade-building-button"
                  variant="confirm"
                  onClick={onBuildingDowngrade}
                >
                  {t('DOWNGRADE_BUILDING', { level: buildingLevel - 1 })}
                </Button>
              )}
              <Button
                data-testid="building-actions-demolish-building-button"
                variant="confirm"
                onClick={onBuildingDemolish}
              >
                {t('DEMOLISH_BUILDING')}
              </Button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (!doesBuildingExist && canBuild) {
    return (
      <section
        data-testid="building-actions-section"
        className="flex flex-col gap-2 pt-2 border-t border-gray-200"
      >
        <h3 className="font-medium">{t('TITLE')}</h3>
        <Button
          data-testid="building-actions-construct-building-button"
          variant="confirm"
          onClick={onBuildingConstruction}
          disabled={!(canAddAdditionalBuildingToQueue && hasEnoughResourcesToBuild)}
        >
          {t('CONSTRUCT_BUILDING')}
        </Button>
      </section>
    );
  }

  return null;
};
