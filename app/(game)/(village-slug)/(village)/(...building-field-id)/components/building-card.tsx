import type {
  assessBuildingConstructionReadiness,
  AssessedBuildingRequirement,
} from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  calculateBuildingEffectValues,
  type CalculatedCumulativeEffect,
  getBuildingDefinition,
  getBuildingDataForLevel,
} from 'app/assets/utils/buildings';
import type { Building } from 'app/interfaces/models/game/building';
import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';
import { createContext, use } from 'react';
import { Fragment } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { formatTime } from 'app/utils/time';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { Icon } from 'app/components/icon';
import { formatNumber, formatPercentage } from 'app/utils/common';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { useEffectServerValue } from 'app/(game)/(village-slug)/hooks/use-effect-server-value';
import { VillageBuildingLink } from 'app/(game)/(village-slug)/components/village-building-link';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { Alert } from 'app/components/ui/alert';

type BuildingCardContextState = {
  buildingId: Building['id'];
  building: Building;
  buildingConstructionReadinessAssessment?: ReturnType<
    typeof assessBuildingConstructionReadiness
  >;
};

export const BuildingCardContext = createContext<BuildingCardContextState>(
  {} as BuildingCardContextState,
);

type BuildingCardProps = {
  buildingId: Building['id'];
  buildingConstructionReadinessAssessment?: ReturnType<
    typeof assessBuildingConstructionReadiness
  >;
};

export const BuildingCard = ({
  buildingId,
  buildingConstructionReadinessAssessment,
  children,
}: PropsWithChildren<BuildingCardProps>) => {
  const building = getBuildingDefinition(buildingId);

  return (
    <BuildingCardContext
      value={{ buildingId, building, buildingConstructionReadinessAssessment }}
    >
      <article className="flex flex-col gap-2 p-2 border border-border">
        {children}
      </article>
    </BuildingCardContext>
  );
};

export const BuildingOverview = () => {
  const { t, t: assetsT } = useTranslation();
  const { buildingId } = use(BuildingCardContext);
  const { buildingFieldId } = use(BuildingFieldContext);
  const { actualLevel, virtualLevel } = useBuildingVirtualLevel(
    buildingId,
    buildingFieldId!,
  );

  const { building, isMaxLevel: isActualMaxLevel } = getBuildingDataForLevel(
    buildingId,
    actualLevel,
  );

  return (
    <section data-testid="building-overview-title-section">
      <Text
        as="h2"
        className="inline-flex"
      >
        {assetsT(`BUILDINGS.${building.id}.NAME`)}
      </Text>
      <div
        data-testid="building-overview-building-image"
        className="flex border border-red justify-center items-center mr-2 float-left size-12 md:size-14"
      >
        image
      </div>
      <Text data-testid="building-overview-building-description">
        {assetsT(`BUILDINGS.${building.id}.DESCRIPTION`)}
      </Text>
      {actualLevel !== virtualLevel && (
        <span
          data-testid="building-overview-currently-upgrading-span"
          className="inline-flex text-warning mt-2"
        >
          {assetsT('Currently upgrading to level {{level}}', {
            level: virtualLevel,
          })}
        </span>
      )}
      {isActualMaxLevel && (
        <span
          data-testid="building-overview-max-level"
          className="inline-flex text-green-600 mt-2"
        >
          {t('{{building}} is fully upgraded', {
            building: assetsT(`BUILDINGS.${building.id}.NAME`),
          })}
        </span>
      )}
    </section>
  );
};

export const BuildingCost = () => {
  const { t } = useTranslation();
  const { buildingFieldId } = use(BuildingFieldContext);
  const { buildingId } = use(BuildingCardContext);
  const { virtualLevel, doesBuildingExist } = useBuildingVirtualLevel(
    buildingId,
    buildingFieldId!,
  );
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
      <section
        data-testid="building-overview-costs-section"
        className="flex flex-col pt-2 flex-wrap gap-2 justify-center border-t border-border"
      >
        <Text as="h3">
          {doesBuildingExist
            ? t('Cost to upgrade to level {{level}}', {
                level: virtualLevel + 1,
              })
            : t('Building construction cost')}
        </Text>
        <Resources resources={nextLevelResourceCost} />
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

  const unfinishedBuildings: Building['id'][] = [
    'HORSE_DRINKING_TROUGH',
    'RESIDENCE',
    'RALLY_POINT',
    'TOWN_HALL',
    'EMBASSY',
    'COMMAND_CENTER',
    'TRAPPER',
    'MARKETPLACE',
  ];

  if (!unfinishedBuildings.includes(buildingId)) {
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

type BuildingBenefitProps = {
  effect: CalculatedCumulativeEffect;
  isMaxLevel: boolean;
  buildingFieldId: BuildingField['id'];
};

const BuildingBenefit = ({ effect, isMaxLevel }: BuildingBenefitProps) => {
  // TODO: Resource production, warehouse & granary values need to be increased by server effect value
  const { hasEffect, serverEffectValue } = useEffectServerValue(
    effect.effectId,
  );

  const formattingFn = effect.type === 'base' ? formatNumber : formatPercentage;

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
              effect.areEffectValuesRising,
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
          effect.areEffectValuesRising,
        )}
      </span>
    </span>
  );
};

export const BuildingBenefits = () => {
  const { t } = useTranslation();
  const { building, buildingId } = use(BuildingCardContext);
  const { buildingFieldId } = use(BuildingFieldContext);
  const { actualLevel, virtualLevel, doesBuildingExist } =
    useBuildingVirtualLevel(buildingId, buildingFieldId!);

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

  const effectsToShow = (() => {
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
  })();

  return (
    <section className="flex flex-col gap-2 pt-2 justify-center border-t border-border">
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
            buildingFieldId={buildingFieldId!}
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
