import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { getBuildingDataForLevel } from 'app/(game)/(village-slug)/utils/building';
import { Button } from 'app/components/ui/button';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useArtifacts } from 'app/(game)/(village-slug)/hooks/use-artifacts';
import { Text } from 'app/components/text';
import { useBuildingConstructionStatus, useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';

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
  const { errors } = useBuildingConstructionStatus(buildingId, buildingFieldId!);

  return (
    <>
      <ErrorBag errorBag={errors} />
      <Button
        data-testid="building-actions-construct-building-button"
        variant="default"
        onClick={onBuildingConstruction}
        disabled={errors.length > 0}
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
  const { errors } = useBuildingUpgradeStatus(buildingFieldId!);

  return (
    <>
      <ErrorBag errorBag={errors} />
      <Button
        data-testid="building-actions-upgrade-building-button"
        variant="default"
        onClick={onBuildingUpgrade}
        disabled={errors.length > 0}
      >
        {t('Upgrade to level {{level}}', { level: buildingLevel + 1 })}
      </Button>
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
  const { playerVillages } = usePlayerVillages();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();
  const { isGreatBuildingsArtifactActive } = useArtifacts();
  const { constructBuilding, upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId!);
  const { virtualLevel, doesBuildingExist } = useBuildingVirtualLevel(buildingId, buildingFieldId!);

  const { isMaxLevel } = getBuildingDataForLevel(buildingId, virtualLevel, currentVillage.isCapital);

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
    startTransition(() => {
      constructBuilding();
    });
  };

  const onBuildingUpgrade = () => {
    navigateBack();
    startTransition(() => {
      upgradeBuilding();
    });
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
    </section>
  );
};
