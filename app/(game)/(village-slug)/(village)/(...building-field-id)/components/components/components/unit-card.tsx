import type React from 'react';
import { Fragment } from 'react';
import { createContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import { Slider } from 'app/components/ui/slider';
import { Separator } from 'app/components/ui/separator';
import {
  getUnitData,
  calculateMaxUnits,
  calculateUnitResearchCost,
  calculateUnitUpgradeCostForLevel,
  calculateUnitResearchDuration,
  calculateUnitUpgradeDurationForLevel,
} from 'app/(game)/(village-slug)/utils/units';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { useUnitImprovementLevel } from 'app/(game)/(village-slug)/hooks/use-unit-improvement-level';
import { useForm } from 'react-hook-form';
import { formatTime } from 'app/utils/time';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { use } from 'react';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import clsx from 'clsx';
import type { Unit } from 'app/interfaces/models/game/unit';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { assessUnitResearchReadiness } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/utils/unit-research-requirements';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import type { PickLiteral } from 'app/utils/typescript';
import type { EffectId } from 'app/interfaces/models/game/effect';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import {
  effectsCacheKey,
  playerTroopsCacheKey,
  playerVillagesCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import type { Building } from 'app/interfaces/models/game/building';

type DurationEffect = PickLiteral<
  EffectId,
  | 'barracksTrainingDuration'
  | 'greatBarracksTrainingDuration'
  | 'stableTrainingDuration'
  | 'greatStableTrainingDuration'
  | 'workshopTrainingDuration'
  | 'hospitalTrainingDuration'
>;

type UnitCardContextState = {
  unitId: Unit['id'];
  buildingId: PickLiteral<Building['id'], 'BARRACKS' | 'GREAT_BARRACKS' | 'STABLE' | 'GREAT_STABLE' | 'WORKSHOP' | 'HOSPITAL'>;
  durationEffect?: DurationEffect;
};

const UnitCardContext = createContext<UnitCardContextState>({} as UnitCardContextState);

type UnitCardProps = {
  unitId: Unit['id'];
  buildingId: PickLiteral<Building['id'], 'BARRACKS' | 'GREAT_BARRACKS' | 'STABLE' | 'GREAT_STABLE' | 'WORKSHOP' | 'HOSPITAL'>;
  durationEffect?: DurationEffect;
  showOuterBorder?: boolean;
};

export const UnitCard: React.FCWithChildren<UnitCardProps> = (props) => {
  const { unitId, buildingId, durationEffect, children, showOuterBorder = true } = props;

  return (
    <UnitCardContext.Provider value={{ unitId, durationEffect, buildingId }}>
      <article className={clsx('flex flex-col gap-2 p-2', showOuterBorder && 'border border-border')}>{children}</article>
    </UnitCardContext.Provider>
  );
};

export const UnitOverview = () => {
  const { unitId } = use(UnitCardContext);
  const { t: assetsT } = useTranslation();

  return (
    <section>
      <div className="inline-flex gap-2 items-center font-semibold">
        <Text as="h2">{assetsT(`UNITS.${unitId}.NAME`, { count: 1 })}</Text>
      </div>
      <div className="flex justify-center items-center mr-1 mb-1 float-left size-10">
        <Icon
          className="size-full"
          type={unitIdToUnitIconMapper(unitId)}
        />
      </div>
      <Text as="p">{assetsT(`UNITS.${unitId}.DESCRIPTION`)}</Text>
    </section>
  );
};

export const UnitLevel: React.FC = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { unitLevel, unitVirtualLevel } = useUnitImprovementLevel(unitId);

  const unit = getUnitData(unitId);

  const attributes: Pick<UnitAttributes, 'attack' | 'infantryDefence' | 'cavalryDefence'> = {
    attack: unit.attack,
    infantryDefence: unit.infantryDefence,
    cavalryDefence: unit.cavalryDefence,
  };

  const calculateUpgradedValue = (value: number, level: number) => {
    return Math.round(value * 1.015 ** level * 10) / 10;
  };

  return (
    <section className="flex flex-col gap-2 pt-2 border-t border-border">
      <Text as="h3">{t('Combat attributes at level {{level}}', { level: unitLevel })}</Text>
      {unitLevel !== unitVirtualLevel && (
        <Text
          as="p"
          className="text-warning"
        >
          {t('Currently being upgraded to level {{level}}', { level: unitVirtualLevel })}
        </Text>
      )}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(attributes).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex whitespace-nowrap gap-2 items-center"
            >
              <Icon
                className="size-5"
                type={key as keyof UnitAttributes}
              />
              <Text as="p">
                {value}
                {unitVirtualLevel > 0 && (
                  <>
                    &rarr;
                    <span className={clsx(unitLevel !== unitVirtualLevel && 'text-warning', 'ml-0.5')}>
                      {calculateUpgradedValue(value, unitVirtualLevel)}
                    </span>
                  </>
                )}
              </Text>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

type UnitAttributes = Record<
  'attack' | 'infantryDefence' | 'cavalryDefence' | 'unitSpeed' | 'unitCarryCapacity' | 'unitWheatConsumption',
  number
>;

export const UnitAttributes = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const unit = getUnitData(unitId);

  const attributes: UnitAttributes = {
    attack: unit.attack,
    infantryDefence: unit.infantryDefence,
    cavalryDefence: unit.cavalryDefence,
    unitSpeed: unit.unitSpeed,
    unitCarryCapacity: unit.unitCarryCapacity,
    unitWheatConsumption: unit.unitWheatConsumption,
  };

  return (
    <section className="flex flex-col gap-2 pt-2 border-t border-border">
      <Text as="h3">{t('Attributes')}</Text>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(attributes).map(([key, value]) => (
          <span
            key={key}
            className="inline-flex whitespace-nowrap gap-2 items-center"
          >
            <Icon
              className="size-5"
              type={key as keyof UnitAttributes}
            />
            {value}
          </span>
        ))}
      </div>
    </section>
  );
};

export const UnitResearch = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { isUnitResearched } = useUnitResearch();
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const { wood, clay, iron, wheat } = use(CurrentVillageStateContext);
  const hasResearched = isUnitResearched(unitId);
  const { createEvent: createUnitResearchEvent } = useCreateEvent('unitResearch');
  const { currentVillage } = useCurrentVillage();
  const { hasEvents: hasResearchEventsOngoing } = useEventsByType('unitResearch');

  const unitResearchDuration = (() => {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    return calculateUnitResearchDuration(unitId);
  })();

  const researchCost = (() => {
    if (isDeveloperModeEnabled) {
      return [0, 0, 0, 0];
    }

    return calculateUnitResearchCost(unitId);
  })();

  const { canResearch } = assessUnitResearchReadiness(unitId, currentVillage);

  const hasEnoughResourcesToResearch =
    wood >= researchCost![0] && clay >= researchCost![1] && iron >= researchCost![2] && wheat >= researchCost![3];

  const canStartResearch = hasEnoughResourcesToResearch && !hasResearchEventsOngoing && canResearch;

  const researchUnit = () => {
    createUnitResearchEvent({
      startsAt: Date.now(),
      duration: unitResearchDuration,
      resourceCost: researchCost,
      unitId,
      cachesToClearImmediately: [playerVillagesCacheKey],
      cachesToClearOnResolve: [unitResearchCacheKey],
    });
  };

  if (hasResearched) {
    return (
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Research')}</Text>
        <Text
          as="p"
          className="text-green-600 font-semibold"
        >
          {t('{{unit}} researched', { unit: assetsT(`UNITS.${unitId}.NAME`, { count: 1 }) })}
        </Text>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Research cost and duration')}</Text>
        <div className="flex gap-2 items-center">
          <Resources
            className="flex-wrap"
            resources={researchCost!}
          />
          <Separator orientation="vertical" />
          <div className="flex gap-1">
            <Icon type="barracksTrainingDuration" />
            {formatTime(unitResearchDuration)}
          </div>
        </div>
      </section>
      {canResearch && (
        <section className="flex flex-col gap-2 pt-2 border-t border-border">
          <Text as="h3">{t('Available actions')}</Text>
          <Button
            onClick={researchUnit}
            variant="default"
            disabled={!canStartResearch}
          >
            {hasResearchEventsOngoing && t('Research is already taking place')}
            {!hasResearchEventsOngoing && t('Research {{unit}}', { unit: assetsT(`UNITS.${unitId}.NAME`, { count: 1 }) })}
          </Button>
        </section>
      )}
    </>
  );
};

export const UnitImprovement = () => {
  const { unitId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const { wood, clay, iron, wheat } = use(CurrentVillageStateContext);
  const { currentVillage } = useCurrentVillage();
  const { createEvent: createUnitImprovementEvent } = useCreateEvent('unitImprovement');
  const { unitVirtualLevel, isMaxLevel } = useUnitImprovementLevel(unitId);
  const { hasEvents: hasImprovementEventsOngoing } = useEventsByType('unitImprovement');

  const unitUpgradeDuration = (() => {
    if (isDeveloperModeEnabled) {
      return 0;
    }

    return calculateUnitUpgradeDurationForLevel(unitId, unitVirtualLevel);
  })();

  const upgradeCost = (() => {
    if (isDeveloperModeEnabled) {
      return [0, 0, 0, 0];
    }

    return calculateUnitUpgradeCostForLevel(unitId, unitVirtualLevel);
  })();

  const hasEnoughResourcesToUpgrade = wood >= upgradeCost[0] && clay >= upgradeCost[1] && iron >= upgradeCost[2] && wheat >= upgradeCost[3];

  const academyLevel = currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'SMITHY')?.level ?? 0;
  const isSmithyLevelHigherThanNextUpgradeLevel = academyLevel >= unitVirtualLevel + 1;

  const canUpgrade = hasEnoughResourcesToUpgrade && isSmithyLevelHigherThanNextUpgradeLevel && !hasImprovementEventsOngoing;

  const upgradeUnit = () => {
    createUnitImprovementEvent({
      level: 1,
      startsAt: Date.now(),
      duration: unitUpgradeDuration,
      unitId,
      cachesToClearOnResolve: [unitImprovementCacheKey],
      resourceCost: upgradeCost,
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  };

  if (isMaxLevel) {
    return (
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Improvement')}</Text>
        <Text
          as="p"
          className="text-green-600 font-semibold"
        >
          {t('{{unit}} is fully upgraded', { unit: assetsT(`UNITS.${unitId}.NAME`, { count: 1 }) })}
        </Text>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Improvement cost and duration for level {{level}}', { level: unitVirtualLevel + 1 })}</Text>
        <div className="flex gap-2 items-center">
          <Resources
            className="flex-wrap"
            resources={upgradeCost!}
          />
          <Separator orientation="vertical" />
          <div className="flex gap-1">
            <Icon type="barracksTrainingDuration" />
            {formatTime(unitUpgradeDuration)}
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-2 pt-2 border-t border-border">
        <Text as="h3">{t('Available actions')}</Text>
        <Button
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
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { assessedRequirements } = assessUnitResearchReadiness(unitId, currentVillage);

  return (
    <section className="pt-2 flex flex-col gap-2 border-t border-border">
      <Text as="h3">{t('Requirements')}</Text>
      <ul className="flex gap-2 flex-wrap">
        {assessedRequirements.map((assessedRequirement, index) => (
          <Fragment key={assessedRequirement.buildingId}>
            <li className="whitespace-nowrap">
              <Text as="p">
                <span className={clsx(assessedRequirement.fulfilled && 'text-muted-foreground line-through')}>
                  {assetsT(`BUILDINGS.${assessedRequirement.buildingId}.NAME`)} {t('level {{level}}', { level: assessedRequirement.level })}
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
  const { baseRecruitmentDuration, baseRecruitmentCost } = getUnitData(unitId);
  const { total } = useComputedEffect(durationEffect ?? 'barracksTrainingDuration');

  return (
    <section className="flex flex-col gap-2 pt-2 border-t border-border">
      <Text as="h3">{t('Cost and training duration')}</Text>
      <div className="flex gap-2 flex-col md:flex-row items-start justify-start">
        <Resources resources={baseRecruitmentCost} />
        <div className="hidden md:flex">
          <Separator orientation="vertical" />
        </div>
        <div className="flex gap-1">
          <Icon type="barracksTrainingDuration" />
          {formatTime(baseRecruitmentDuration * (durationEffect ? total : 1))}
        </div>
      </div>
    </section>
  );
};

export const UnitRecruitment = () => {
  const { unitId, durationEffect, buildingId } = use(UnitCardContext);
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const currentResources = use(CurrentVillageStateContext);
  const { baseRecruitmentCost, baseRecruitmentDuration, unitWheatConsumption } = getUnitData(unitId);
  const { total } = useComputedEffect(durationEffect!);
  const { eventsByType } = useEventsByType('troopTraining');
  const { createBulkEvent: createTroopTrainingEvents } = useCreateEvent('troopTraining');

  const relevantTrainingEvents = eventsByType.filter((event) => {
    return event.buildingId === buildingId;
  });

  const hasEvents = relevantTrainingEvents.length > 0;

  const startsAt = (() => {
    if (hasEvents) {
      const lastEvent = relevantTrainingEvents.at(-1)!;
      return lastEvent.startsAt + lastEvent.duration;
    }

    return Date.now();
  })();

  const individualUnitRecruitmentCost = (() => {
    if (isDeveloperModeEnabled) {
      return [0, 0, 0, 0];
    }

    // Great barracks/stable have 3x the cost
    if (['greatBarracksTrainingDuration', 'greatStableTrainingDuration'].includes(durationEffect!)) {
      return baseRecruitmentCost.map((cost) => cost * 3);
    }

    return baseRecruitmentCost;
  })();

  const individualUnitRecruitmentDuration = (() => {
    if (isDeveloperModeEnabled) {
      return 5_000;
    }

    return baseRecruitmentDuration;
  })();

  const maxUnits = isDeveloperModeEnabled ? 1000 : calculateMaxUnits(currentResources, individualUnitRecruitmentCost);

  const form = useForm({ defaultValues: { amount: 0 } });
  const { register, handleSubmit, setValue, watch } = form;
  const amount = watch('amount');
  const duration = Math.trunc(total * individualUnitRecruitmentDuration * amount);
  const formattedDuration = formatTime(duration);
  const totalCost = individualUnitRecruitmentCost.map((cost) => cost * amount);

  const onSubmit = ({ amount }: { amount: number }) => {
    form.reset();

    createTroopTrainingEvents({
      batchId: window.crypto.randomUUID(),
      buildingId,
      amount,
      unitId,
      startsAt,
      duration,
      resourceCost: totalCost,
      cachesToClearOnResolve: [playerTroopsCacheKey, effectsCacheKey],
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  };

  return (
    <section className="pt-2 flex flex-col gap-2 border-t border-border">
      <Text as="h3">{t('Train units')}</Text>
      <div className="flex gap-2 flex-col md:flex-row items-start justify-start">
        <Resources resources={totalCost} />
        <div className="hidden md:flex">
          <Separator orientation="vertical" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            <Icon type="barracksTrainingDuration" />
            {formattedDuration}
          </div>
          <Separator orientation="vertical" />
          <div className="flex gap-1">
            <Icon
              variant="negative-change"
              type="unitWheatConsumption"
            />
            {unitWheatConsumption * amount}
          </div>
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
                  unit: assetsT(`UNITS.${unitId}.NAME`, { count: amount }),
                })}
            </>
          )}
        </Button>
      </form>
    </section>
  );
};
