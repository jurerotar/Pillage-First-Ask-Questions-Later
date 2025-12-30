import { clsx } from 'clsx';
import { createContext, Fragment, type PropsWithChildren, use } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import {
  calculateMaxUnits,
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from '@pillage-first/game-assets/units/utils';
import type { TroopTrainingBuildingId } from '@pillage-first/types/models/building';
import type { TroopTrainingDurationEffectId } from '@pillage-first/types/models/effect';
import type { Unit } from '@pillage-first/types/models/unit';
import { BuildingActionsErrorBag } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-actions-error-bag';
import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/academy/utils/unit-research-requirements';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { VillageBuildingLink } from 'app/(game)/(village-slug)/components/village-building-link';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useHasEnoughStorageCapacity } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-storage-capacity';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useUnitImprovementLevel } from 'app/(game)/(village-slug)/hooks/use-unit-improvement-level';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import { Slider } from 'app/components/ui/slider';
import { formatTime } from 'app/utils/time';

type UnitCardContextState = {
  unitId: Unit['id'];
  buildingId: TroopTrainingBuildingId;
  durationEffect?: TroopTrainingDurationEffectId;
};

const UnitCardContext = createContext<UnitCardContextState>(
  {} as UnitCardContextState,
);

type UnitCardProps = {
  unitId: Unit['id'];
  buildingId: TroopTrainingBuildingId;
  durationEffect?: TroopTrainingDurationEffectId;
  showOuterBorder?: boolean;
};

export const UnitCard = (props: PropsWithChildren<UnitCardProps>) => {
  const {
    unitId,
    buildingId,
    durationEffect,
    children,
    showOuterBorder = true,
  } = props;

  return (
    <UnitCardContext value={{ unitId, durationEffect, buildingId }}>
      <article
        className={clsx(
          'flex flex-col gap-2 p-2',
          showOuterBorder && 'border border-border',
        )}
      >
        {children}
      </article>
    </UnitCardContext>
  );
};

export const UnitOverview = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();

  return (
    <section>
      <div className="inline-flex gap-2 items-center font-semibold">
        <Text as="h2">{t(`UNITS.${unitId}.NAME`)}</Text>
      </div>
      <div className="flex justify-center items-center mr-1 mb-1 float-left size-10">
        <Icon
          className="size-full"
          type={unitIdToUnitIconMapper(unitId)}
        />
      </div>
      <Text>{t(`UNITS.${unitId}.DESCRIPTION`)}</Text>
    </section>
  );
};

type UnitAttributes = Record<
  | 'attack'
  | 'infantryDefence'
  | 'cavalryDefence'
  | 'unitSpeed'
  | 'unitCarryCapacity'
  | 'unitWheatConsumption',
  number
>;

const calculateUpgradedValue = (value: number, level: number) => {
  return Math.round(value * 1.015 ** level * 10) / 10;
};

export const UnitAttributes = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { unitLevel, unitVirtualLevel } = useUnitImprovementLevel(unitId);

  const unit = getUnitDefinition(unitId);

  const dynamicAttributes: Pick<
    UnitAttributes,
    'attack' | 'infantryDefence' | 'cavalryDefence'
  > = {
    attack: unit.attack,
    infantryDefence: unit.infantryDefence,
    cavalryDefence: unit.cavalryDefence,
  };

  const staticAttributes: Pick<
    UnitAttributes,
    'unitSpeed' | 'unitCarryCapacity' | 'unitWheatConsumption'
  > = {
    unitSpeed: unit.unitSpeed,
    unitCarryCapacity: unit.unitCarryCapacity,
    unitWheatConsumption: unit.unitWheatConsumption,
  };

  return (
    <section className="flex flex-col gap-2 pt-2 border-t border-border">
      <Text as="h3">
        {t('Attributes at level {{level}}', { level: unitLevel })}
      </Text>
      {unitLevel !== unitVirtualLevel && (
        <Text className="text-warning">
          {t('Currently being upgraded to level {{level}}', {
            level: unitVirtualLevel,
          })}
        </Text>
      )}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(dynamicAttributes).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex whitespace-nowrap gap-1 items-center"
            >
              <Icon
                className="size-5"
                type={key as keyof UnitAttributes}
              />
              <Text>
                <span
                  className={clsx(
                    unitLevel !== unitVirtualLevel && 'text-warning',
                  )}
                >
                  {calculateUpgradedValue(value, unitVirtualLevel)}
                </span>
              </Text>
            </span>
          ))}
          {Object.entries(staticAttributes).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex whitespace-nowrap gap-1 items-center"
            >
              <Icon
                className="size-5"
                type={key as keyof UnitAttributes}
              />
              <Text>{value}</Text>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export const UnitResearch = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { isUnitResearched } = useUnitResearch();
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const { total: unitResearchDurationModifier } = useComputedEffect(
    'unitResearchDuration',
  );
  const hasResearched = isUnitResearched(unitId);
  const { createEvent: createUnitResearchEvent } =
    useCreateEvent('unitResearch');
  const { currentVillage } = useCurrentVillage();
  const { hasEvents: hasResearchEventsOngoing, eventsByType: researchEvents } =
    useEventsByType('unitResearch');

  const unitResearchDuration = (() => {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    return unitResearchDurationModifier * calculateUnitResearchDuration(unitId);
  })();

  const researchCost = (() => {
    if (isDeveloperModeEnabled) {
      return [0, 0, 0, 0];
    }

    return calculateUnitResearchCost(unitId);
  })();

  const { canResearch } = assessUnitResearchReadiness(unitId, currentVillage);

  const { errorBag: hasEnoughResourcesErrorBag } =
    useHasEnoughResources(researchCost);
  const { errorBag: hasEnoughWarehouseCapacityErrorBag } =
    useHasEnoughStorageCapacity('warehouseCapacity', researchCost);
  const { errorBag: hasEnoughGranaryCapacityErrorBag } =
    useHasEnoughStorageCapacity('granaryCapacity', researchCost);

  const isThisUnitCurrentlyBeingResearched = researchEvents.some(
    ({ unitId: researchedUnitId }) => unitId === researchedUnitId,
  );

  if (isThisUnitCurrentlyBeingResearched) {
    return (
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Research')}</Text>
        <Text className="text-green-600">
          {t('{{unit}} is currently being researched', {
            unit: t(`UNITS.${unitId}.NAME`),
          })}
        </Text>
      </section>
    );
  }

  if (hasResearched) {
    return (
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Research')}</Text>
        <Text className="text-green-600">
          {t('{{unit}} researched', {
            unit: t(`UNITS.${unitId}.NAME`),
          })}
        </Text>
      </section>
    );
  }

  const errorBag = [
    ...hasEnoughResourcesErrorBag,
    ...hasEnoughWarehouseCapacityErrorBag,
    ...hasEnoughGranaryCapacityErrorBag,
  ];

  if (hasResearchEventsOngoing) {
    errorBag.push(t('Academy is already busy researching a different unit.'));
  }

  const canStartResearch = errorBag.length === 0;

  const researchUnit = () => {
    createUnitResearchEvent({
      unitId,
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  };

  return (
    <>
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Research cost and duration')}</Text>
        <div className="flex gap-2 items-center flex-wrap">
          <Resources
            className="flex-wrap"
            resources={researchCost}
          />
          <div className="flex gap-1 items-center">
            <Icon
              className="size-5"
              type="barracksTrainingDuration"
            />
            {formatTime(unitResearchDuration)}
          </div>
        </div>
      </section>
      {canResearch && (
        <section className="flex flex-col gap-2 pt-2 border-t border-border">
          <Text as="h3">{t('Available actions')}</Text>
          <BuildingActionsErrorBag errorBag={errorBag} />

          <Button
            onClick={researchUnit}
            variant="default"
            size="fit"
            disabled={!canStartResearch}
          >
            {t('Research {{unit}}', {
              unit: t(`UNITS.${unitId}.NAME`),
            })}
          </Button>
        </section>
      )}
    </>
  );
};

export const UnitImprovement = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const { currentVillage } = useCurrentVillage();
  const { total: unitImprovementDurationModifier } = useComputedEffect(
    'unitImprovementDuration',
  );
  const { createEvent: createUnitImprovementEvent } =
    useCreateEvent('unitImprovement');
  const { unitVirtualLevel, isMaxLevel } = useUnitImprovementLevel(unitId);
  const { hasEvents: hasImprovementEventsOngoing } =
    useEventsByType('unitImprovement');

  const unitUpgradeDuration = (() => {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    return (
      unitImprovementDurationModifier *
      calculateUnitUpgradeDurationForLevel(unitId, unitVirtualLevel)
    );
  })();

  const upgradeCost = (() => {
    if (isDeveloperModeEnabled) {
      return [0, 0, 0, 0];
    }

    return calculateUnitUpgradeCostForLevel(unitId, unitVirtualLevel);
  })();

  const { errorBag: hasEnoughResourcesErrorBag } =
    useHasEnoughResources(upgradeCost);
  const { errorBag: hasEnoughWarehouseCapacityErrorBag } =
    useHasEnoughStorageCapacity('warehouseCapacity', upgradeCost);
  const { errorBag: hasEnoughGranaryCapacityErrorBag } =
    useHasEnoughStorageCapacity('granaryCapacity', upgradeCost);

  const smithyLevel =
    currentVillage.buildingFields.find(
      ({ buildingId }) => buildingId === 'SMITHY',
    )?.level ?? 0;

  const isSmithyLevelHigherThanNextUpgradeLevel =
    smithyLevel >= unitVirtualLevel + 1;

  const errorBag = [
    ...hasEnoughResourcesErrorBag,
    ...hasEnoughWarehouseCapacityErrorBag,
    ...hasEnoughGranaryCapacityErrorBag,
  ];

  if (!isSmithyLevelHigherThanNextUpgradeLevel) {
    errorBag.push(t('Your Smithy level is too low to start next upgrade.'));
  }

  if (hasImprovementEventsOngoing) {
    errorBag.push(t('Smithy is currently busy.'));
  }

  const canUpgrade = errorBag.length === 0;

  const upgradeUnit = () => {
    createUnitImprovementEvent({
      unitId,
      level: unitVirtualLevel,
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  };

  if (isMaxLevel) {
    return (
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Improvement')}</Text>
        <Text className="text-green-600">
          {t('{{unit}} is fully upgraded', {
            unit: t(`UNITS.${unitId}.NAME`),
          })}
        </Text>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">
          {t('Improvement cost and duration for level {{level}}', {
            level: unitVirtualLevel + 1,
          })}
        </Text>
        <div className="flex gap-2 items-center flex-wrap">
          <Resources resources={upgradeCost} />
          <div className="flex items-center gap-1">
            <Icon
              className="size-5"
              type="barracksTrainingDuration"
            />
            {formatTime(unitUpgradeDuration)}
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Available actions')}</Text>
        <BuildingActionsErrorBag errorBag={errorBag} />
        <Button
          size="fit"
          variant="default"
          disabled={!canUpgrade}
          onClick={upgradeUnit}
        >
          {t('Upgrade to level {{level}}', { level: unitVirtualLevel + 1 })}
        </Button>
      </section>
    </>
  );
};

export const UnitRequirements = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { assessedRequirements } = assessUnitResearchReadiness(
    unitId,
    currentVillage,
  );

  return (
    <section className="pt-2 flex flex-col gap-2 border-t border-border">
      <Text as="h3">{t('Requirements')}</Text>
      <ul className="flex gap-2 flex-wrap">
        {assessedRequirements.map((assessedRequirement, index) => (
          <Fragment key={assessedRequirement.buildingId}>
            <li className="whitespace-nowrap">
              <Text>
                <span
                  className={clsx(
                    assessedRequirement.fulfilled &&
                      'text-muted-foreground line-through',
                  )}
                >
                  <Trans>
                    <VillageBuildingLink
                      buildingId={assessedRequirement.buildingId}
                    />{' '}
                    level {{ level: assessedRequirement.level }}
                  </Trans>
                </span>
                {index !== assessedRequirements.length - 1 && ','}
              </Text>
            </li>
          </Fragment>
        ))}
      </ul>
    </section>
  );
};

export const UnitCost = () => {
  const { unitId, durationEffect } = use(UnitCardContext);
  const { t } = useTranslation();
  const { baseRecruitmentDuration, baseRecruitmentCost } =
    getUnitDefinition(unitId);
  const { total: trainingDurationModifier } = useComputedEffect(
    durationEffect ?? 'barracksTrainingDuration',
  );

  return (
    <section className="flex flex-col gap-2 pt-2 border-t border-border">
      <Text as="h3">{t('Cost and training duration')}</Text>
      <div className="flex gap-2 items-start justify-start flex-wrap">
        <Resources resources={baseRecruitmentCost} />
        <div className="flex gap-1 items-center">
          <Icon
            className="size-5"
            type="barracksTrainingDuration"
          />
          {formatTime(
            baseRecruitmentDuration *
              (durationEffect ? trainingDurationModifier : 1),
          )}
        </div>
      </div>
    </section>
  );
};

export const UnitRecruitmentNoResearch = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();

  return (
    <section className="pt-2 flex flex-col gap-2 border-t border-border">
      <Text as="h3">{t('Train units')}</Text>
      <Text variant="orange">
        <Trans>
          You need to research {{ unitName: t(`UNITS.${unitId}.NAME`) }} at the{' '}
          <VillageBuildingLink buildingId="ACADEMY" /> before you can begin
          training
        </Trans>
      </Text>
    </section>
  );
};

export const UnitRecruitment = () => {
  const { t } = useTranslation();
  const { unitId, durationEffect, buildingId } = use(UnitCardContext);
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const currentResources = use(CurrentVillageStateContext);
  const { baseRecruitmentCost, baseRecruitmentDuration, unitWheatConsumption } =
    getUnitDefinition(unitId);
  const { total } = useComputedEffect(durationEffect!);
  const { createEvent: createTroopTrainingEvent } =
    useCreateEvent('troopTraining');

  const individualUnitRecruitmentCost = (() => {
    if (isDeveloperModeEnabled) {
      return [0, 0, 0, 0];
    }

    // Great barracks/stable have 3x the cost
    if (
      ['greatBarracksTrainingDuration', 'greatStableTrainingDuration'].includes(
        durationEffect!,
      )
    ) {
      return baseRecruitmentCost.map((cost) => cost * 3);
    }

    return baseRecruitmentCost;
  })();

  const individualUnitRecruitmentDuration = (() => {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    return baseRecruitmentDuration;
  })();

  const maxUnits = isDeveloperModeEnabled
    ? 1000
    : calculateMaxUnits(currentResources, individualUnitRecruitmentCost);

  const form = useForm({ defaultValues: { amount: 0 } });
  const { register, handleSubmit, setValue, watch } = form;
  const amount = watch('amount');
  const duration = Math.trunc(total * individualUnitRecruitmentDuration);

  const formattedDuration = formatTime(duration * amount);

  const totalCost = individualUnitRecruitmentCost.map((cost) => cost * amount);

  const onSubmit = ({ amount }: { amount: number }) => {
    form.reset();

    createTroopTrainingEvent({
      batchId: window.crypto.randomUUID(),
      buildingId,
      amount,
      unitId,
      durationEffectId: durationEffect!,
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  };

  return (
    <section className="pt-2 flex flex-col gap-2 border-t border-border">
      <Text as="h3">{t('Train units')}</Text>
      <div className="flex items-start gap-2 justify-start flex-wrap">
        <Resources resources={totalCost} />
        <div className="flex gap-1 items-center">
          <Icon
            className="size-5"
            type="barracksTrainingDuration"
          />
          {formattedDuration}
        </div>
        <div className="flex gap-1 items-center">
          <Icon
            className="size-5"
            subIcon="negativeChange"
            type="unitWheatConsumption"
          />
          {unitWheatConsumption * amount}
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Slider
              min={0}
              max={maxUnits}
              value={[amount]}
              disabled={maxUnits === 0}
              onValueChange={([val]) => setValue('amount', val)}
            />
            <div className="flex w-30">
              <Input
                type="number"
                min={0}
                max={maxUnits}
                {...register('amount', { valueAsNumber: true })}
                value={amount}
                disabled={maxUnits === 0}
                onChange={(e) => setValue('amount', Number(e.target.value))}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="fit"
              className="px-1.5 py-1 h-full"
              disabled={maxUnits === 0}
              onClick={() => setValue('amount', maxUnits)}
            >
              ({maxUnits})
            </Button>
          </div>
        </div>
        <Button
          size="fit"
          type="submit"
          disabled={maxUnits === 0 || amount === 0}
        >
          {maxUnits === 0 && t('Not enough resources')}
          {maxUnits > 0 && (
            <>
              {amount === 0 && t('Select the amount of units to train')}
              {amount > 0 &&
                t('Train {{count}} {{unit}}', {
                  count: amount,
                  unit: t(`UNITS.${unitId}.NAME`, { count: amount }),
                })}
            </>
          )}
        </Button>
      </form>
    </section>
  );
};
