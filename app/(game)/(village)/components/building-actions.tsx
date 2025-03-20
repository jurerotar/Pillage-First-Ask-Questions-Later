import { useBuildingActions } from 'app/(game)/(village)/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/(game)/(village)/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { getBuildingDataForLevel, specialFieldIds } from 'app/(game)/utils/building';
import { Button } from 'app/components/buttons/button';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useArtifacts } from 'app/(game)/hooks/use-artifacts';
import { Text } from 'app/components/text';
import { useBuildingDowngradeStatus, useBuildingUpgradeStatus } from 'app/(game)/hooks/use-building-level-change-status';

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
  const { getCurrentVillageBuildingEvents } = useEvents();
  const { isGreatBuildingsArtifactActive } = useArtifacts();
  const { constructBuilding, upgradeBuilding, downgradeBuilding, demolishBuilding } = useBuildingActions(buildingId, buildingFieldId!);
  const { buildingLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId!);
  const { getBuildingUpgradeErrorBag } = useBuildingUpgradeStatus(buildingFieldId!);
  const { getBuildingDowngradeErrorBag } = useBuildingDowngradeStatus(buildingId);

  const buildingUpgradeErrorBag = getBuildingUpgradeErrorBag();
  const buildingDowngradeErrorBag = getBuildingDowngradeErrorBag();
  const { isMaxLevel } = getBuildingDataForLevel(buildingId, buildingLevel);
  const playerVillages = getPlayerVillages();
  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);

  const isSpecialBuilding = specialFieldIds.includes(buildingFieldId!);
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

  if (!doesBuildingExist) {
    if (!canBuild) {
      return null;
    }

    return (
      <section
        data-testid="building-actions-section"
        className="flex flex-col gap-2 pt-2 border-t border-gray-200"
      >
        <Text as="h3">{t('Available actions')}</Text>
        {buildingUpgradeErrorBag.length > 0 && (
          <ul className="flex flex-col ml-4 gap-1 list-disc">
            {buildingUpgradeErrorBag.map((error) => (
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
          disabled={buildingUpgradeErrorBag.length > 0}
        >
          {t('Construct')}
        </Button>
      </section>
    );
  }

  if (isMaxLevel && !canDemolishBuildings) {
    return null;
  }

  return (
    <section
      data-testid="building-actions-section"
      className="flex flex-col gap-2 pt-2 border-t border-gray-200"
    >
      <Text as="h3">{t('Available actions')}</Text>
      {buildingUpgradeErrorBag.length > 0 && (
        <ul className="flex flex-col ml-4 gap-1 list-disc">
          {buildingUpgradeErrorBag.map((error) => (
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
        disabled={buildingUpgradeErrorBag.length > 0}
      >
        {t('Upgrade to level {{level}}', { level: buildingLevel + 1 })}
      </Button>
      {canDemolishBuildings && buildingLevel > 0 && (
        <>
          {buildingDowngradeErrorBag.length > 0 && (
            <ul className="flex flex-col ml-4 gap-1 list-disc">
              {buildingDowngradeErrorBag.map((error) => (
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
            {buildingLevel > 1 && (
              <Button
                data-testid="building-actions-downgrade-building-button"
                variant="confirm"
                onClick={onBuildingDowngrade}
                disabled={buildingDowngradeErrorBag.length > 0}
              >
                {t('Downgrade to level {{level}}', { level: buildingLevel - 1 })}
              </Button>
            )}
            {buildingLevel > 0 && (
              <Button
                data-testid="building-actions-demolish-building-button"
                variant="confirm"
                onClick={onBuildingDemolish}
                disabled={buildingDowngradeErrorBag.length > 0}
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
