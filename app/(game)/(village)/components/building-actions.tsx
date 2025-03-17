import { useBuildingActions } from 'app/(game)/(village)/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/(game)/(village)/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { calculatePopulationFromBuildingFields, getBuildingDataForLevel, specialFieldIds } from 'app/(game)/utils/building';
import { Button } from 'app/components/buttons/button';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { CurrentResourceContext } from 'app/(game)/providers/current-resources-provider';
import { useArtifacts } from 'app/(game)/hooks/use-artifacts';
import { Text } from 'app/components/text';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingActions: React.FC<BuildingCardProps> = ({ buildingId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribe } = useTribe();
  const { getPlayerVillages } = useVillages();
  const { currentVillage } = use(CurrentVillageContext);
  const { buildingFieldId } = useRouteSegments();
  const { isDeveloperModeActive } = useDeveloperMode();
  const { getCurrentVillageBuildingEvents, getCanAddAdditionalBuildingToQueue } = useEvents();
  const { isGreatBuildingsArtifactActive } = useArtifacts();
  const { wood, clay, iron, wheat } = use(CurrentResourceContext);
  const { constructBuilding, upgradeBuilding, downgradeBuilding, demolishBuilding } = useBuildingActions(buildingId, buildingFieldId!);
  const { buildingLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId!);
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');

  const { nextLevelResourceCost, isMaxLevel, nextLevelCropConsumption } = getBuildingDataForLevel(buildingId, buildingLevel);
  const playerVillages = getPlayerVillages();
  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);
  const population = calculatePopulationFromBuildingFields(currentVillage.buildingFields, currentVillage.buildingFieldsPresets);

  const isSpecialBuilding = specialFieldIds.includes(buildingFieldId!);
  const isBuildingCurrentlyBeingUpgraded = currentVillageBuildingEvents.some(({ building }) => building.id === buildingId);
  const doesBuildingExist = buildingLevel > 0 || isSpecialBuilding;
  const canDemolishBuildings = (currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0) >= 10;

  const navigateBack = () => {
    navigate('..', { relative: 'path' });
  };

  const { canBuild } = assessBuildingConstructionReadiness({
    buildingId,
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
    isGreatBuildingsArtifactActive,
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

  const hasEnoughWheatToBuild = !(nextLevelCropConsumption > 0) && wheatBuildingLimit - population < nextLevelCropConsumption;

  const onBuildingConstruction = () => {
    constructBuilding();
    navigateBack();
  };

  const onBuildingUpgrade = () => {
    upgradeBuilding();
    navigateBack();
  };

  const onBuildingDowngrade = () => {
    downgradeBuilding();
    navigateBack();
  };

  const onBuildingDemolish = () => {
    demolishBuilding();
    navigateBack();
  };

  const canAddAdditionalBuildingToQueue = getCanAddAdditionalBuildingToQueue(currentVillage, buildingFieldId!);

  if (!doesBuildingExist) {
    if (!canBuild) {
      return null;
    }

    const constructionErrorBag = [];

    // TODO: Add warehouse and granary check here as well
    if (!canAddAdditionalBuildingToQueue) {
      constructionErrorBag.push(t('Building queue is full'));
    }

    if (!hasEnoughResourcesToBuild) {
      constructionErrorBag.push(t('Not enough resources available'));
    }

    if (!hasEnoughWheatToBuild) {
      constructionErrorBag.push(t('Upgrade wheat fields first'));
    }

    return (
      <section
        data-testid="building-actions-section"
        className="flex flex-col gap-2 pt-2 border-t border-gray-200"
      >
        <Text as="h3">{t('Available actions')}</Text>
        {constructionErrorBag.length > 0 && (
          <ul className="flex flex-col ml-4 gap-1 list-disc">
            {constructionErrorBag.map((error) => (
              <li
                className="text-red-500 text-sm font-medium"
                key={error}
              >
                {error}
              </li>
            ))}
          </ul>
        )}
        <Button
          data-testid="building-actions-construct-building-button"
          variant="confirm"
          onClick={onBuildingConstruction}
          disabled={constructionErrorBag.length > 0}
        >
          {t('Construct')}
        </Button>
      </section>
    );
  }

  if (isMaxLevel && !canDemolishBuildings) {
    return null;
  }

  const upgradeErrorBag = [];

  // TODO: Add warehouse and granary check here as well
  if (!canAddAdditionalBuildingToQueue) {
    upgradeErrorBag.push(t('Building queue is full'));
  }

  if (!hasEnoughResourcesToBuild) {
    upgradeErrorBag.push(t('Not enough resources available'));
  }

  if (!hasEnoughWheatToBuild) {
    upgradeErrorBag.push(t('Upgrade wheat fields first'));
  }

  const downgradeErrorBag = [];

  // TODO: Add warehouse and granary check here as well
  if (isBuildingCurrentlyBeingUpgraded) {
    downgradeErrorBag.push(t("Building can't be downgraded or demolished while it's being upgraded"));
  }

  return (
    <section
      data-testid="building-actions-section"
      className="flex flex-col gap-2 pt-2 border-t border-gray-200"
    >
      <Text as="h3">{t('Available actions')}</Text>
      {upgradeErrorBag.length > 0 && (
        <ul className="flex flex-col ml-4 gap-1 list-disc">
          {upgradeErrorBag.map((error) => (
            <li
              className="text-red-500 text-sm font-medium"
              key={error}
            >
              {error}
            </li>
          ))}
        </ul>
      )}
      <Button
        data-testid="building-actions-upgrade-building-button"
        variant="confirm"
        onClick={onBuildingUpgrade}
        disabled={upgradeErrorBag.length > 0}
      >
        {t('Upgrade to level {{level}}', { level: buildingLevel + 1 })}
      </Button>
      {canDemolishBuildings && buildingLevel > 0 && (
        <>
          {downgradeErrorBag.length > 0 && (
            <ul className="flex flex-col ml-4 gap-1 list-disc">
              {downgradeErrorBag.map((error) => (
                <li
                  className="text-red-500 text-sm font-medium"
                  key={error}
                >
                  {error}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            {((isSpecialBuilding && buildingLevel > 0) || (!isSpecialBuilding && buildingLevel > 1)) && (
              <Button
                data-testid="building-actions-downgrade-building-button"
                variant="confirm"
                onClick={onBuildingDowngrade}
                disabled={downgradeErrorBag.length > 0}
              >
                {t('Downgrade to level {{level}}', { level: buildingLevel - 1 })}
              </Button>
            )}
            {buildingLevel > 0 && (
              <Button
                data-testid="building-actions-demolish-building-button"
                variant="confirm"
                onClick={onBuildingDemolish}
                disabled={downgradeErrorBag.length > 0}
              >
                {t('Demolish completely')}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
};
