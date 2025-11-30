import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  getBuildingDataForLevel,
  getBuildingFieldByBuildingFieldId,
} from 'app/assets/utils/buildings';
import { Button } from 'app/components/ui/button';
import type { Building } from 'app/interfaces/models/game/building';
import { startTransition, use } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Text } from 'app/components/text';
import {
  useBuildingConstructionStatus,
  useBuildingUpgradeStatus,
} from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import { BuildingCardContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { BuildingActionsErrorBag } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-actions-error-bag';

type BuildingCardActionsSectionProps = {
  buildingId: Building['id'];
  onBuildingConstruction: () => void;
};

const BuildingCardActionsConstruction = ({
  buildingId,
  onBuildingConstruction,
}: BuildingCardActionsSectionProps) => {
  const { t } = useTranslation();
  const { buildingFieldId } = use(BuildingFieldContext);
  const { errors } = useBuildingConstructionStatus(buildingId, buildingFieldId);

  return (
    <>
      <BuildingActionsErrorBag errorBag={errors} />
      <Button
        data-testid="building-actions-construct-building-button"
        variant="default"
        size="fit"
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

const BuildingCardActionsUpgrade = ({
  onBuildingUpgrade,
  buildingLevel,
}: BuildingCardActionsUpgradeProps) => {
  const { t } = useTranslation();
  const { buildingFieldId } = use(BuildingFieldContext);
  const { currentVillage } = useCurrentVillage();

  const buildingField = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
  );

  const { errors } = useBuildingUpgradeStatus(buildingField!);

  return (
    <>
      <BuildingActionsErrorBag errorBag={errors} />
      <Button
        data-testid="building-actions-upgrade-building-button"
        variant="default"
        size="fit"
        onClick={onBuildingUpgrade}
        disabled={errors.length > 0}
      >
        {t('Upgrade to level {{level}}', { level: buildingLevel + 1 })}
      </Button>
    </>
  );
};

export const BuildingActions = () => {
  const { t } = useTranslation();
  const { buildingId, buildingConstructionReadinessAssessment } =
    use(BuildingCardContext);
  const navigate = useNavigate();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = use(BuildingFieldContext);
  const { preferences } = usePreferences();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );
  const { constructBuilding, upgradeBuilding } = useBuildingActions(
    buildingId,
    buildingFieldId,
  );
  const { virtualLevel, doesBuildingExist } = useBuildingVirtualLevel(
    buildingId,
    buildingFieldId,
  );

  const { isMaxLevel } = getBuildingDataForLevel(buildingId, virtualLevel);

  const navigateBack = async () => {
    await navigate('..', { relative: 'path' });
  };

  const { canBuild } =
    buildingConstructionReadinessAssessment ??
    assessBuildingConstructionReadiness({
      buildingId,
      tribe,
      currentVillageBuildingEvents,
      currentVillage,
    });

  const onBuildingConstruction = async () => {
    await navigateBack();
    startTransition(() => {
      constructBuilding();
    });
  };

  const onBuildingUpgrade = async () => {
    if (preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled) {
      await navigateBack();
    }

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
        className="flex flex-col gap-2 pt-2 border-t border-border"
      >
        <Text as="h3">{t('Available actions')}</Text>
        <BuildingCardActionsConstruction
          buildingId={buildingId}
          onBuildingConstruction={onBuildingConstruction}
        />
      </section>
    );
  }

  if (isMaxLevel) {
    return null;
  }

  return (
    <section
      data-testid="building-actions-section"
      className="flex flex-col gap-2 pt-2 border-t border-border"
    >
      <Text as="h3">{t('Available actions')}</Text>
      <BuildingCardActionsUpgrade
        buildingLevel={virtualLevel}
        onBuildingUpgrade={onBuildingUpgrade}
      />
    </section>
  );
};
