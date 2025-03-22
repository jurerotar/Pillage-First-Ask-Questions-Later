import { useBuildingActions } from 'app/(game)/(village)/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/(game)/(village)/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { getBuildingDataForLevel } from 'app/(game)/utils/building';
import { Button } from 'app/components/buttons/button';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useArtifacts } from 'app/(game)/hooks/use-artifacts';
import { Text } from 'app/components/text';
import {
  useBuildingConstructionStatus,
  useBuildingDowngradeStatus,
  useBuildingUpgradeStatus,
} from 'app/(game)/hooks/use-building-level-change-status';

type ErrorBagProps = {
  errorBag: string[];
};

const ErrorBag: React.FC<ErrorBagProps> = ({ errorBag }) => {
  if (errorBag.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col ml-4 gap-1 list-disc">
      {errorBag.map((error) => (
        <li
          className="text-red-500 text-sm font-medium"
          key={error}
        >
          {error}
        </li>
      ))}
    </ul>
  );
};

type BuildingCardActionsSectionProps = {
  buildingId: Building['id'];
  onBuildingConstruction: () => void;
};

const BuildingCardActionsConstruction: React.FC<BuildingCardActionsSectionProps> = ({ buildingId, onBuildingConstruction }) => {
  const { t } = useTranslation();
  const { buildingFieldId } = useRouteSegments();
  const { getBuildingConstructionErrorBag } = useBuildingConstructionStatus(buildingId, buildingFieldId!);

  const buildingConstructionErrorBag = getBuildingConstructionErrorBag();

  return (
    <>
      <ErrorBag errorBag={buildingConstructionErrorBag} />
      <Button
        data-testid="building-actions-construct-building-button"
        variant="confirm"
        onClick={onBuildingConstruction}
        disabled={buildingConstructionErrorBag.length > 0}
      >
        {t('Construct')}
      </Button>
    </>
  );
};

type BuildingCardActionsUpgradeProps = {
  onBuildingUpgrade: () => void;
  buildingLevel: number;
};

const BuildingCardActionsUpgrade: React.FC<BuildingCardActionsUpgradeProps> = ({ onBuildingUpgrade, buildingLevel }) => {
  const { t } = useTranslation();
  const { buildingFieldId } = useRouteSegments();
  const { getBuildingUpgradeErrorBag } = useBuildingUpgradeStatus(buildingFieldId!);

  const buildingUpgradeErrorBag = getBuildingUpgradeErrorBag();

  return (
    <>
      <ErrorBag errorBag={buildingUpgradeErrorBag} />
      <Button
        data-testid="building-actions-upgrade-building-button"
        variant="confirm"
        onClick={onBuildingUpgrade}
        disabled={buildingUpgradeErrorBag.length > 0}
      >
        {t('Upgrade to level {{level}}', { level: buildingLevel + 1 })}
      </Button>
    </>
  );
};

type BuildingCardActionsDowngradeProps = {
  buildingId: Building['id'];
  onBuildingDowngrade: () => void;
  onBuildingDemolish: () => void;
  buildingLevel: number;
};

const BuildingCardActionsDowngrade: React.FC<BuildingCardActionsDowngradeProps> = ({
  buildingId,
  onBuildingDowngrade,
  onBuildingDemolish,
  buildingLevel,
}) => {
  const { t } = useTranslation();
  const { getBuildingDowngradeErrorBag } = useBuildingDowngradeStatus(buildingId);

  const buildingDowngradeErrorBag = getBuildingDowngradeErrorBag();

  return (
    <>
      <ErrorBag errorBag={buildingDowngradeErrorBag} />
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
  );
};

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
  const { virtualLevel, doesBuildingExist } = useBuildingVirtualLevel(buildingId, buildingFieldId!);

  const { isMaxLevel } = getBuildingDataForLevel(buildingId, virtualLevel);
  const playerVillages = getPlayerVillages();
  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);

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
    navigateBack();
    constructBuilding();
  };

  const onBuildingUpgrade = () => {
    navigateBack();
    upgradeBuilding();
  };

  const onBuildingDowngrade = () => {
    navigateBack();
    downgradeBuilding();
  };

  const onBuildingDemolish = () => {
    navigateBack();
    demolishBuilding();
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
        <BuildingCardActionsConstruction
          buildingId={buildingId}
          onBuildingConstruction={onBuildingConstruction}
        />
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
      {!isMaxLevel && (
        <BuildingCardActionsUpgrade
          buildingLevel={virtualLevel}
          onBuildingUpgrade={onBuildingUpgrade}
        />
      )}
      {canDemolishBuildings && virtualLevel > 0 && (
        <BuildingCardActionsDowngrade
          onBuildingDemolish={onBuildingDemolish}
          onBuildingDowngrade={onBuildingDowngrade}
          buildingId={buildingId}
          buildingLevel={virtualLevel}
        />
      )}
    </section>
  );
};
