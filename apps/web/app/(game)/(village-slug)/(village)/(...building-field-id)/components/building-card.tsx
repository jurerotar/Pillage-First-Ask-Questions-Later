import { clsx } from 'clsx';
import {
  createContext,
  Fragment,
  type PropsWithChildren,
  startTransition,
  use,
  useMemo,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  type CalculatedCumulativeEffect,
  calculateBuildingEffectValues,
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { Effect } from '@pillage-first/types/models/effect';
import { formatNumber, formatPercentage } from '@pillage-first/utils/format';
import {
  type AssessedBuildingRequirement,
  assessBuildingRequirements,
} from '@pillage-first/utils/game/building-requirements';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { VillageBuildingLink } from 'app/(game)/(village-slug)/components/village-building-link';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useBuildingConstructionErrorBag } from 'app/(game)/(village-slug)/hooks/use-building-construction-error-bag';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useEffectServerValue } from 'app/(game)/(village-slug)/hooks/use-effect-server-value';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { useDialog } from 'app/hooks/use-dialog';
import { formatTime } from 'app/utils/time';

type BuildingCardContextState = {
  buildingId: Building['id'];
  building: Building;
  buildingConstructionReadinessAssessment?: ReturnType<
    typeof assessBuildingRequirements
  >;
  shouldAllowUnmetRequirementsForScheduledConstruction?: boolean;
};

const BuildingCardContext = createContext<BuildingCardContextState>(
  {} as BuildingCardContextState,
);

type BuildingCardProps = {
  buildingId: Building['id'];
  buildingConstructionReadinessAssessment?: ReturnType<
    typeof assessBuildingRequirements
  >;
  shouldAllowUnmetRequirementsForScheduledConstruction?: boolean;
};

const unfinishedBuildings = new Set<Building['id']>([
  'HORSE_DRINKING_TROUGH',
  'RESIDENCE',
  'HOSPITAL',
  'CRANNY',
  'RALLY_POINT',
  'TOWN_HALL',
  'EMBASSY',
  'COMMAND_CENTER',
  'TRAPPER',
  'MARKETPLACE',
  'TRADE_OFFICE',
]);

export const BuildingCard = ({
  buildingId,
  buildingConstructionReadinessAssessment,
  shouldAllowUnmetRequirementsForScheduledConstruction,
  children,
}: PropsWithChildren<BuildingCardProps>) => {
  const { t } = useTranslation();
  const building = getBuildingDefinition(buildingId);

  const value = useMemo(
    () => ({
      buildingId,
      building,
      buildingConstructionReadinessAssessment,
      shouldAllowUnmetRequirementsForScheduledConstruction,
    }),
    [
      buildingId,
      building,
      buildingConstructionReadinessAssessment,
      shouldAllowUnmetRequirementsForScheduledConstruction,
    ],
  );

  return (
    <BuildingCardContext value={value}>
      <article className="flex flex-col gap-2 relative [&>section:nth-of-type(2)]:pt-0! [&>section:nth-of-type(2)]:border-t-0!">
        <InformationPopover ariaLabel={t(`BUILDINGS.${building.id}.NAME`)}>
          <Text>{t(`BUILDINGS.${building.id}.DESCRIPTION`)}</Text>
        </InformationPopover>
        {children}
      </article>
    </BuildingCardContext>
  );
};

export const BuildingOverview = () => {
  const { t } = useTranslation();
  const { buildingId } = use(BuildingCardContext);
  const { actualLevel, virtualLevel, isUpgrading, isDowngrading } =
    use(BuildingFieldContext);

  const { building, isMaxLevel: isActualMaxLevel } = getBuildingDataForLevel(
    buildingId,
    actualLevel,
  );

  return (
    <section className="flex flex-col gap-2">
      <Text
        as="h2"
        className="inline-flex"
      >
        {t(`BUILDINGS.${building.id}.NAME`)}
      </Text>
      {(isUpgrading || isDowngrading) && (
        <span className="inline-flex text-warning">
          {t(
            isUpgrading
              ? 'Currently upgrading to level {{level}}'
              : 'Currently downgrading to level {{level}}',
            {
              level: virtualLevel,
            },
          )}
        </span>
      )}
      {isActualMaxLevel && (
        <span className="inline-flex text-green-600">
          {t('{{building}} is fully upgraded', {
            building: t(`BUILDINGS.${building.id}.NAME`),
          })}
        </span>
      )}
    </section>
  );
};

export const BuildingCost = () => {
  const { t } = useTranslation();
  const { buildingId } = use(BuildingCardContext);
  const { virtualLevel, doesBuildingExist } = use(BuildingFieldContext);
  const { total: buildingDuration } = useComputedEffect('buildingDuration');

  const { nextLevelBuildingDuration, nextLevelResourceCost, isMaxLevel } =
    getBuildingDataForLevel(buildingId, virtualLevel);

  const formattedTime = formatTime(
    buildingDuration * nextLevelBuildingDuration,
  );

  if (isMaxLevel) {
    return null;
  }

  return (
    <>
      <section className="flex flex-col pt-2 flex-wrap gap-2 justify-center border-t border-border">
        <Text as="h3">
          {doesBuildingExist
            ? t('Cost to upgrade to level {{level}}', {
                level: virtualLevel + 1,
              })
            : t('Building construction cost')}
        </Text>
        <div className="flex gap-2">
          <Resources resources={nextLevelResourceCost} />
        </div>
      </section>
      <section className="flex flex-col flex-wrap gap-2 pt-2 border-t border-border justify-center">
        <Text as="h3">
          {t('Construction duration for level {{level}}', {
            level: virtualLevel + 1,
          })}
        </Text>
        <span className="flex gap-1">
          <Icon type="buildingDuration" />
          {formattedTime}
        </span>
      </section>
    </>
  );
};

export const BuildingUnfinishedNotice = () => {
  const { t } = useTranslation();
  const { buildingId } = use(BuildingCardContext);

  if (!unfinishedBuildings.has(buildingId)) {
    return null;
  }

  return (
    <Alert variant="warning">
      {t(
        'Building is not fully implemented, some functionality may be missing.',
      )}
    </Alert>
  );
};

type BuildingScheduledConstructionConfirmationDialogProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const BuildingScheduledConstructionConfirmationDialog = ({
  isOpen,
  onCancel,
  onConfirm,
}: BuildingScheduledConstructionConfirmationDialogProps) => {
  const { t } = useTranslation();
  const {
    buildingConstructionReadinessAssessment,
    shouldAllowUnmetRequirementsForScheduledConstruction,
  } = use(BuildingCardContext);

  if (
    buildingConstructionReadinessAssessment?.canBuild ||
    !shouldAllowUnmetRequirementsForScheduledConstruction
  ) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Confirm queued construction')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <Alert variant="warning">
            {t(
              'This building does not currently meet all requirements. You may still schedule it, but construction will only start if all prerequisites are met.',
            )}
          </Alert>
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="confirm"
            onClick={onConfirm}
          >
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const increasingPercentageBuildingEffects = new Set<Effect['id']>([
  'merchantCapacity',
  'unitSpeedAfter20Fields',
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
  'defenceBonus',
]);

type BuildingBenefitProps = {
  effect: CalculatedCumulativeEffect;
  isMaxLevel: boolean;
};

const BuildingBenefit = ({ effect, isMaxLevel }: BuildingBenefitProps) => {
  const { hasEffect, serverEffectValue } = useEffectServerValue(
    effect.effectId,
  );

  const formattingFn = effect.type === 'base' ? formatNumber : formatPercentage;

  const isIncreasing = increasingPercentageBuildingEffects.has(effect.effectId);

  const effectModifier =
    effect.type === 'base' && hasEffect ? serverEffectValue : 1;

  return (
    <span
      key={effect.effectId}
      className="flex gap-2"
    >
      <Icon
        type={effect.effectId}
        className="size-6"
        {...(!isMaxLevel && {
          subIcon: effect.areEffectValuesRising
            ? 'positiveChange'
            : 'negativeChange',
        })}
      />
      <span>
        {!isMaxLevel && effect.currentLevelValue !== effect.nextLevelValue && (
          <>
            {formattingFn(
              Math.abs(effect.currentLevelValue * effectModifier),
              isIncreasing,
            )}
            <span className="mx-0.5">&rarr;</span>
          </>
        )}
        {formattingFn(
          Math.abs(
            isMaxLevel
              ? effect.currentLevelValue * effectModifier
              : effect.nextLevelValue * effectModifier,
          ),
          isIncreasing,
        )}
      </span>
    </span>
  );
};

export const BuildingBenefits = () => {
  const { t } = useTranslation();
  const { building, buildingId } = use(BuildingCardContext);
  const { actualLevel, virtualLevel, doesBuildingExist } =
    use(BuildingFieldContext);

  const {
    isMaxLevel,
    population,
    nextLevelPopulation,
    culturePoints,
    nextLevelCulturePoints,
  } = getBuildingDataForLevel(buildingId, virtualLevel);

  const cumulativeEffects = calculateBuildingEffectValues(
    building,
    actualLevel,
  );

  // In case we have both infantry and cavalry defence, we show combined defence icon instead
  const shouldCombineEffects =
    cumulativeEffects.length > 0 &&
    cumulativeEffects.every(
      ({ effectId }) =>
        effectId === 'infantryDefence' || effectId === 'cavalryDefence',
    );

  const effectsToShow = useMemo(() => {
    if (shouldCombineEffects) {
      const staticDefenceEffect = cumulativeEffects.find(
        ({ effectId, type }) =>
          type === 'base' &&
          (effectId === 'infantryDefence' || effectId === 'cavalryDefence'),
      );
      const staticDefenceBonusEffect = cumulativeEffects.find(
        ({ effectId, type }) =>
          type === 'bonus' &&
          (effectId === 'infantryDefence' || effectId === 'cavalryDefence'),
      );

      const effects: CalculatedCumulativeEffect[] = [];

      if (staticDefenceEffect) {
        effects.push({
          ...staticDefenceEffect,
          effectId: 'defence',
        } satisfies CalculatedCumulativeEffect);
      }

      if (staticDefenceBonusEffect) {
        effects.push({
          ...staticDefenceBonusEffect,
          effectId: 'defenceBonus',
        } satisfies CalculatedCumulativeEffect);
      }

      return effects;
    }

    return cumulativeEffects;
  }, [shouldCombineEffects, cumulativeEffects]);

  return (
    <section className="flex flex-col gap-2 justify-center">
      <Text as="h3">
        {isMaxLevel
          ? t('Benefits')
          : t('Benefits at level {{level}}', {
              level: doesBuildingExist ? actualLevel + 1 : 1,
            })}
      </Text>
      <div className="flex flex-wrap gap-2">
        <span className="flex gap-2">
          <Icon
            type="population"
            className="size-6"
            {...(!isMaxLevel && {
              subIcon: 'positiveChange',
            })}
          />
          <span>
            {!isMaxLevel && (
              <>
                {population}
                {population !== nextLevelPopulation && (
                  <>
                    <span className="mx-0.5">&rarr;</span>
                    {nextLevelPopulation}
                  </>
                )}
              </>
            )}
            {isMaxLevel && population}
          </span>
        </span>
        <span className="flex gap-2">
          <Icon
            type="culturePoints"
            className="size-6"
            {...(!isMaxLevel && {
              subIcon: 'positiveChange',
            })}
          />
          <span>
            {!isMaxLevel && (
              <>
                {culturePoints}
                {culturePoints !== nextLevelCulturePoints && (
                  <>
                    <span className="mx-0.5">&rarr;</span>
                    {nextLevelCulturePoints}
                  </>
                )}
              </>
            )}
            {isMaxLevel && culturePoints}
          </span>
        </span>
        {effectsToShow.map((effect) => (
          <BuildingBenefit
            key={effect.effectId}
            effect={effect}
            isMaxLevel={isMaxLevel}
          />
        ))}
      </div>
    </section>
  );
};

export const BuildingRequirements = () => {
  const { t } = useTranslation();
  const { buildingId, buildingConstructionReadinessAssessment } =
    use(BuildingCardContext);
  const { currentVillage } = useCurrentVillage();

  const { canBuild, assessedRequirements } =
    buildingConstructionReadinessAssessment!;

  if (canBuild) {
    return null;
  }

  const { maxLevel } = getBuildingDefinition(buildingId);

  const sameBuildingInstances = currentVillage.buildingFields.filter(
    ({ buildingId: id }) => id === buildingId,
  );
  const instanceAlreadyExists = sameBuildingInstances.length > 0;

  // We don't show tribal requirements
  const requirementsToDisplay = assessedRequirements.filter(({ type }) => {
    if (type === 'amount') {
      return instanceAlreadyExists;
    }

    return ['building', 'amount'].includes(type);
  });

  return (
    <section className="flex flex-col border-t border-border pt-2 gap-2">
      <Text as="h3">{t('Requirements')}</Text>
      <ul className="flex gap-x-2 flex-wrap">
        {requirementsToDisplay.map(
          (assessedRequirement: AssessedBuildingRequirement, index) => (
            <Fragment key={assessedRequirement.id}>
              <li className="whitespace-nowrap">
                <Text
                  className={clsx(
                    assessedRequirement.fulfilled &&
                      'text-muted-foreground line-through',
                  )}
                >
                  {assessedRequirement.type === 'amount' &&
                    instanceAlreadyExists && (
                      <Trans>
                        <VillageBuildingLink buildingId={buildingId} /> level{' '}
                        {{ level: maxLevel }}
                      </Trans>
                    )}
                  {assessedRequirement.type === 'building' && (
                    <Trans>
                      <VillageBuildingLink
                        buildingId={assessedRequirement.buildingId}
                      />{' '}
                      level {{ level: assessedRequirement.level }}
                    </Trans>
                  )}
                  {index !== requirementsToDisplay.length - 1 && ','}
                </Text>
              </li>
            </Fragment>
          ),
        )}
      </ul>
    </section>
  );
};

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
  const { errorBag } = useBuildingConstructionErrorBag(
    buildingId,
    0,
    buildingFieldId,
  );

  return (
    <>
      <ErrorBag errorBag={errorBag} />
      <Button
        data-testid="building-actions-construct-building-button"
        variant="default"
        size="fit"
        onClick={onBuildingConstruction}
        disabled={errorBag.length > 0}
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
  const { buildingFieldId, buildingField } = use(BuildingFieldContext);
  const { buildingId, level } = buildingField!;

  const { errorBag } = useBuildingConstructionErrorBag(
    buildingId,
    level,
    buildingFieldId,
  );

  return (
    <>
      <ErrorBag errorBag={errorBag} />
      <Button
        data-testid="building-actions-upgrade-building-button"
        variant="default"
        size="fit"
        onClick={onBuildingUpgrade}
        disabled={errorBag.length > 0}
      >
        {t('Upgrade to level {{level}}', { level: buildingLevel + 1 })}
      </Button>
    </>
  );
};

export const BuildingActions = () => {
  const { t } = useTranslation();
  const {
    buildingId,
    building,
    buildingConstructionReadinessAssessment,
    shouldAllowUnmetRequirementsForScheduledConstruction,
  } = use(BuildingCardContext);
  const navigate = useNavigate();
  const tribe = useTribe();
  const {
    buildingFieldId,
    virtualLevel,
    doesBuildingExist,
    maxLevelByBuildingId,
    buildingIdsInQueue,
  } = use(BuildingFieldContext);
  const { preferences } = usePreferences();
  const {
    isOpen: isScheduledConstructionConfirmationOpen,
    openModal: openScheduledConstructionConfirmationModal,
    closeModal: closeScheduledConstructionConfirmationModal,
  } = useDialog();
  const { constructBuilding, upgradeBuilding } = useBuildingActions(
    buildingId,
    buildingFieldId,
  );
  const { isMaxLevel } = getBuildingDataForLevel(buildingId, virtualLevel);

  const navigateBack = async () => {
    await navigate('..', { relative: 'path' });
  };

  const { canBuild } =
    buildingConstructionReadinessAssessment ??
    assessBuildingRequirements({
      building,
      tribe,
      maxLevelByBuildingId,
      buildingIdsInQueue,
    });
  const shouldConfirmUnmetScheduledConstruction =
    !canBuild && shouldAllowUnmetRequirementsForScheduledConstruction;

  const queueBuildingConstruction = async () => {
    closeScheduledConstructionConfirmationModal();
    await navigateBack();
    startTransition(() => {
      constructBuilding();
    });
  };

  const onBuildingConstruction = async () => {
    if (shouldConfirmUnmetScheduledConstruction) {
      openScheduledConstructionConfirmationModal();
      return;
    }

    await queueBuildingConstruction();
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
    if (!canBuild && !shouldAllowUnmetRequirementsForScheduledConstruction) {
      return null;
    }

    return (
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Available actions')}</Text>
        <BuildingCardActionsConstruction
          buildingId={buildingId}
          onBuildingConstruction={onBuildingConstruction}
        />
        <BuildingScheduledConstructionConfirmationDialog
          isOpen={isScheduledConstructionConfirmationOpen}
          onCancel={() => {
            closeScheduledConstructionConfirmationModal();
          }}
          onConfirm={queueBuildingConstruction}
        />
      </section>
    );
  }

  if (isMaxLevel) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2 pt-2 border-t border-border">
      <Text as="h3">{t('Available actions')}</Text>
      <BuildingCardActionsUpgrade
        buildingLevel={virtualLevel}
        onBuildingUpgrade={onBuildingUpgrade}
      />
    </section>
  );
};
