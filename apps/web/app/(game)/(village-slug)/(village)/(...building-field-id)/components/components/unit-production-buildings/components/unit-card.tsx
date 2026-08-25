import { clsx } from 'clsx';
import {
  createContext,
  Fragment,
  type PropsWithChildren,
  use,
  useMemo,
} from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  calculateMaxUnits,
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from '@pillage-first/game-assets/utils/units';
import type {
  Building,
  TroopTrainingBuildingId,
} from '@pillage-first/types/models/building';
import type { TroopTrainingDurationEffectId } from '@pillage-first/types/models/effect';
import type { Unit } from '@pillage-first/types/models/unit';
import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/academy/utils/unit-research-requirements';
import { useUnitRecruitmentErrorBag } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/unit-production-buildings/components/hooks/use-unit-recruitment-error-bag';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { VillageBuildingLink } from 'app/(game)/(village-slug)/components/village-building-link';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useHasEnoughStorageCapacity } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-storage-capacity';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useUnitImprovementLevel } from 'app/(game)/(village-slug)/hooks/use-unit-improvement-level';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { InformationPopover } from 'app/(game)/components/information-popover';
import {
  currentVillageCacheKey,
  woundedTroopsCacheKey,
} from 'app/(game)/constants/query-keys';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import { Slider } from 'app/components/ui/slider';
import { formatTime } from 'app/utils/time';

const defaultTroopTrainingDurationEffect = 'barracksTrainingDuration';

type TroopTrainingBuildingConfig = {
  buildingId: TroopTrainingBuildingId;
  durationEffect: TroopTrainingDurationEffectId;
  category: Unit['category'];
};

export const troopTrainingBuildingConfigMap = new Map<
  Building['id'],
  TroopTrainingBuildingConfig
>([
  [
    'BARRACKS',
    {
      buildingId: 'BARRACKS',
      durationEffect: 'barracksTrainingDuration',
      category: 'infantry',
    },
  ],
  [
    'STABLE',
    {
      buildingId: 'STABLE',
      durationEffect: 'stableTrainingDuration',
      category: 'cavalry',
    },
  ],
  [
    'WORKSHOP',
    {
      buildingId: 'WORKSHOP',
      durationEffect: 'workshopTrainingDuration',
      category: 'siege',
    },
  ],
  [
    'GREAT_BARRACKS',
    {
      buildingId: 'GREAT_BARRACKS',
      durationEffect: 'greatBarracksTrainingDuration',
      category: 'infantry',
    },
  ],
  [
    'GREAT_STABLE',
    {
      buildingId: 'GREAT_STABLE',
      durationEffect: 'greatStableTrainingDuration',
      category: 'cavalry',
    },
  ],
  [
    'RESIDENCE',
    {
      buildingId: 'RESIDENCE',
      durationEffect: 'residenceTrainingDuration',
      category: 'administration',
    },
  ],
]);

type UnitCardContextState = {
  unitId: Unit['id'];
  troopTrainingConfig: TroopTrainingBuildingConfig | null;
};

const UnitCardContext = createContext<UnitCardContextState>(
  {} as UnitCardContextState,
);

type UnitCardProps = {
  unitId: Unit['id'];
};

export const UnitCard = (props: PropsWithChildren<UnitCardProps>) => {
  const { unitId, children } = props;

  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const troopTrainingConfig =
    buildingField == null
      ? null
      : (troopTrainingBuildingConfigMap.get(buildingField.buildingId) ?? null);

  const value = useMemo(() => {
    return {
      unitId,
      troopTrainingConfig,
    };
  }, [unitId, troopTrainingConfig]);

  return (
    <UnitCardContext value={value}>
      <article className="flex flex-col gap-2 relative [&>section:nth-of-type(2)]:!pt-0 [&>section:nth-of-type(2)]:!border-t-0">
        <InformationPopover ariaLabel={t(`UNITS.${unitId}.NAME`)}>
          <Text>{t(`UNITS.${unitId}.DESCRIPTION`)}</Text>
        </InformationPopover>
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
        <Icon
          className="size-6"
          type={unitIdToUnitIconMapper(unitId)}
        />
        <Text as="h2">{t(`UNITS.${unitId}.NAME`)}</Text>
      </div>
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
    <section className="flex flex-col gap-2">
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
  const currentResources = use(CurrentVillageLiveResourcesContext);
  const { isUnitResearched } = useUnitResearch();
  const { developerSettings } = useDeveloperSettings();
  const { total: unitResearchDurationModifier } = useComputedEffect(
    'unitResearchDuration',
  );
  const hasResearched = isUnitResearched(unitId);
  const { createEvent: createUnitResearchEvent } =
    useCreateEvent('unitResearch');
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const { currentVillage } = useCurrentVillage();
  const { hasEvents: hasResearchEventsOngoing, eventsByType: researchEvents } =
    useEventsByType('unitResearch');

  const { isFreeUnitResearchEnabled, isInstantUnitResearchEnabled } =
    developerSettings;

  const unitResearchDuration = (() => {
    if (isInstantUnitResearchEnabled) {
      return 0;
    }

    return unitResearchDurationModifier * calculateUnitResearchDuration(unitId);
  })();

  const researchCost = (() => {
    if (isFreeUnitResearchEnabled) {
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
      <section className="flex flex-col gap-2">
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
      <section className="flex flex-col gap-2">
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

  const researchUnit = async () => {
    if (preferences.isAutomaticNavigationAfterUnitResearchEnabled) {
      await navigate('..', { relative: 'path' });
    }

    createUnitResearchEvent({
      unitId,
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillage.slug]],
    });
  };

  return (
    <>
      <section className="flex flex-col gap-2">
        <Text as="h3">{t('Research cost and duration')}</Text>
        <div className="flex gap-2 items-center flex-wrap">
          <Resources
            availableResources={currentResources}
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
        <section className="flex flex-col gap-2">
          <Text as="h3">{t('Available actions')}</Text>
          <ErrorBag errorBag={errorBag} />

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
  const currentResources = use(CurrentVillageLiveResourcesContext);
  const { developerSettings } = useDeveloperSettings();
  const { currentVillage } = useCurrentVillage();
  const { total: unitImprovementDurationModifier } = useComputedEffect(
    'unitImprovementDuration',
  );
  const { createEvent: createUnitImprovementEvent } =
    useCreateEvent('unitImprovement');
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const { unitVirtualLevel, isMaxLevel } = useUnitImprovementLevel(unitId);
  const { eventsByType: unitImprovementEvents } =
    useEventsByType('unitImprovement');

  const currentVillageUnitImprovementEvents = unitImprovementEvents.filter(
    ({ villageId }) => currentVillage.id === villageId,
  );
  const hasOngoingCurrentVillageImprovementEvents =
    currentVillageUnitImprovementEvents.length > 0;

  const { isFreeUnitImprovementEnabled, isInstantUnitImprovementEnabled } =
    developerSettings;

  const unitUpgradeDuration = (() => {
    if (isInstantUnitImprovementEnabled) {
      return 0;
    }

    return (
      unitImprovementDurationModifier *
      calculateUnitUpgradeDurationForLevel(unitId, unitVirtualLevel + 1)
    );
  })();

  const upgradeCost = (() => {
    if (isFreeUnitImprovementEnabled) {
      return [0, 0, 0, 0];
    }

    return calculateUnitUpgradeCostForLevel(unitId, unitVirtualLevel + 1);
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

  if (hasOngoingCurrentVillageImprovementEvents) {
    errorBag.push(t('Smithy is currently busy.'));
  }

  const canUpgrade = errorBag.length === 0;

  const upgradeUnit = async () => {
    if (preferences.isAutomaticNavigationAfterUnitUpgradeEnabled) {
      await navigate('..', { relative: 'path' });
    }

    createUnitImprovementEvent({
      unitId,
      level: unitVirtualLevel + 1,
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillage.slug]],
    });
  };

  if (isMaxLevel) {
    return (
      <section className="flex flex-col gap-2">
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
      <section className="flex flex-col gap-2">
        <Text as="h3">
          {t('Improvement cost and duration for level {{level}}', {
            level: unitVirtualLevel + 1,
          })}
        </Text>
        <div className="flex gap-2 items-center flex-wrap">
          <Resources
            availableResources={currentResources}
            resources={upgradeCost}
          />
          <div className="flex items-center gap-1">
            <Icon
              className="size-5"
              type="barracksTrainingDuration"
            />
            {formatTime(unitUpgradeDuration)}
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <Text as="h3">{t('Available actions')}</Text>
        <ErrorBag errorBag={errorBag} />
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

  if (assessedRequirements.every(({ fulfilled }) => fulfilled)) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
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
  const { unitId, troopTrainingConfig } = use(UnitCardContext);
  const { t } = useTranslation();
  const currentResources = use(CurrentVillageLiveResourcesContext);
  const { baseRecruitmentDuration, baseRecruitmentCost } =
    getUnitDefinition(unitId);
  const durationEffect =
    troopTrainingConfig?.durationEffect ?? defaultTroopTrainingDurationEffect;
  const { total: trainingDurationModifier } = useComputedEffect(durationEffect);

  return (
    <section className="flex flex-col gap-2">
      <Text as="h3">{t('Cost and training duration')}</Text>
      <div className="flex gap-2 items-start justify-start flex-wrap">
        <Resources
          availableResources={currentResources}
          resources={baseRecruitmentCost}
        />
        <div className="flex gap-1 items-center">
          <Icon
            className="size-5"
            type={durationEffect}
          />
          {formatTime(
            baseRecruitmentDuration *
              (troopTrainingConfig ? trainingDurationModifier : 1),
          )}
        </div>
      </div>
    </section>
  );
};

export const UnitRecruitment = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { unitId, troopTrainingConfig } = use(UnitCardContext);
  const { developerSettings } = useDeveloperSettings();
  const currentResources = use(CurrentVillageLiveResourcesContext);
  const { baseRecruitmentCost, baseRecruitmentDuration, unitWheatConsumption } =
    getUnitDefinition(unitId);
  const durationEffect =
    troopTrainingConfig?.durationEffect ?? defaultTroopTrainingDurationEffect;
  const { total } = useComputedEffect(durationEffect);
  const { createEvent: createTroopTrainingEvent } =
    useCreateEvent('troopTraining');
  const { errorBag } = useUnitRecruitmentErrorBag(unitId);

  const { isFreeUnitTrainingEnabled, isInstantUnitTrainingEnabled } =
    developerSettings;

  const individualUnitRecruitmentCost = (() => {
    if (isFreeUnitTrainingEnabled) {
      return [0, 0, 0, 0];
    }

    // Great barracks/stable have 3x the cost
    if (
      ['greatBarracksTrainingDuration', 'greatStableTrainingDuration'].includes(
        durationEffect,
      )
    ) {
      return baseRecruitmentCost.map((cost) => cost * 3);
    }

    return baseRecruitmentCost;
  })();

  const individualUnitRecruitmentDuration = (() => {
    if (isInstantUnitTrainingEnabled) {
      return 0;
    }

    return baseRecruitmentDuration;
  })();

  const maxUnits = isFreeUnitTrainingEnabled
    ? 1000
    : calculateMaxUnits(currentResources, individualUnitRecruitmentCost);

  const form = useForm({ defaultValues: { amount: 0 } });

  const { buildingId } = troopTrainingConfig!;
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
      durationEffectId: durationEffect,
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillage.slug]],
    });
  };

  const buttonLabel = (() => {
    if (errorBag.length > 0) {
      return t('Missing requirements');
    }
    if (maxUnits === 0) {
      return t('Not enough resources');
    }
    if (amount === 0) {
      return t('Select the amount of units to train');
    }

    return t('Train {{count}} {{unit}}', {
      count: amount,
      unit: t(`UNITS.${unitId}.NAME`, { count: amount }),
    });
  })();

  return (
    <section className="flex flex-col gap-2">
      <Text as="h3">{t('Total cost')}</Text>
      <div className="flex items-start gap-2 justify-start flex-wrap">
        <Resources
          availableResources={currentResources}
          resources={totalCost}
        />
        <div className="flex gap-1 items-center">
          <Icon
            className="size-5"
            type={durationEffect}
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
              disabled={maxUnits === 0 || errorBag.length > 0}
              onValueChange={([val]) => setValue('amount', val)}
            />
            <div className="flex w-30">
              <Input
                type="number"
                min={0}
                max={maxUnits}
                {...register('amount', { valueAsNumber: true })}
                value={amount}
                disabled={maxUnits === 0 || errorBag.length > 0}
                onChange={(e) => setValue('amount', Number(e.target.value))}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="fit"
              className="px-1.5 py-1 h-full"
              disabled={maxUnits === 0 || errorBag.length > 0}
              onClick={() => setValue('amount', maxUnits)}
            >
              ({maxUnits})
            </Button>
          </div>
        </div>
        <Button
          size="fit"
          type="submit"
          disabled={maxUnits === 0 || amount === 0 || errorBag.length > 0}
        >
          {buttonLabel}
        </Button>
      </form>
      <ErrorBag errorBag={errorBag} />
    </section>
  );
};

type UnitHealingProps = {
  woundedAmount: number;
};

export const UnitHealing = ({ woundedAmount }: UnitHealingProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { unitId } = use(UnitCardContext);
  const { developerSettings } = useDeveloperSettings();
  const currentResources = use(CurrentVillageLiveResourcesContext);
  const { buildingField } = use(BuildingFieldContext);
  const { total: hospitalTrainingDurationModifier } = useComputedEffect(
    'hospitalTrainingDuration',
  );
  const { createEvent: createTroopTrainingEvent } =
    useCreateEvent('troopTraining');

  const buildingId = buildingField!.buildingId as TroopTrainingBuildingId;
  const { baseRecruitmentCost, baseRecruitmentDuration } =
    getUnitDefinition(unitId);

  const { isFreeUnitTrainingEnabled, isInstantUnitTrainingEnabled } =
    developerSettings;

  const individualHealingCost = isFreeUnitTrainingEnabled
    ? [0, 0, 0, 0]
    : baseRecruitmentCost;

  const maxHealableByResources = isFreeUnitTrainingEnabled
    ? woundedAmount
    : calculateMaxUnits(currentResources, individualHealingCost);
  const maxHealable = Math.min(woundedAmount, maxHealableByResources);

  const form = useForm({ defaultValues: { amount: 0 } });
  const { register, handleSubmit, setValue, watch } = form;
  const amount = Math.min(watch('amount'), maxHealable);
  const perUnitHealingDuration = isInstantUnitTrainingEnabled
    ? 0
    : Math.ceil(
        hospitalTrainingDurationModifier * baseRecruitmentDuration * 0.5,
      );
  const totalCost = individualHealingCost.map((cost) => cost * amount);

  const onSubmit = ({ amount }: { amount: number }) => {
    if (amount <= 0) {
      return;
    }

    form.reset();

    createTroopTrainingEvent({
      batchId: window.crypto.randomUUID(),
      buildingId,
      amount,
      unitId,
      durationEffectId: 'hospitalTrainingDuration',
      cachesToClearImmediately: [
        [currentVillageCacheKey, currentVillage.slug],
        [woundedTroopsCacheKey, currentVillage.id],
      ],
    });
  };

  const buttonLabel = (() => {
    if (maxHealable === 0) {
      return t('Not enough resources');
    }

    if (amount === 0) {
      return t('Select the amount of units to heal');
    }

    return t('Heal {{count}} {{unit}}', {
      count: amount,
      unit: t(`UNITS.${unitId}.NAME`, { count: amount }),
    });
  })();

  return (
    <section className="flex flex-col gap-2">
      <Text as="h3">{t('Heal units')}</Text>
      <Text>
        {t('{{count}} wounded {{unit}} available', {
          count: woundedAmount,
          unit: t(`UNITS.${unitId}.NAME`, { count: woundedAmount }),
        })}
      </Text>
      <div className="flex items-start gap-2 justify-start flex-wrap">
        <Resources
          availableResources={currentResources}
          resources={totalCost}
        />
        <div className="flex gap-1 items-center">
          <Icon
            className="size-5"
            type="hospitalTrainingDuration"
          />
          {formatTime(perUnitHealingDuration * amount)}
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <Slider
            min={0}
            max={maxHealable}
            value={[amount]}
            disabled={maxHealable === 0}
            onValueChange={([value]) => setValue('amount', value)}
          />
          <div className="flex w-30">
            <Input
              type="number"
              min={0}
              max={maxHealable}
              {...register('amount', { valueAsNumber: true })}
              value={amount}
              disabled={maxHealable === 0}
              onChange={(e) => setValue('amount', Number(e.target.value))}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="fit"
            className="px-1.5 py-1 h-full"
            disabled={maxHealable === 0}
            onClick={() => setValue('amount', maxHealable)}
          >
            ({maxHealable})
          </Button>
        </div>
        <Button
          size="fit"
          type="submit"
          disabled={maxHealable === 0 || amount === 0}
        >
          {buttonLabel}
        </Button>
      </form>
    </section>
  );
};
