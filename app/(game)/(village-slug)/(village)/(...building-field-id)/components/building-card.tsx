import {
  assessBuildingConstructionReadiness,
  type AssessedBuildingRequirement,
} from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  calculateBuildingEffectValues,
  type CalculatedCumulativeEffect,
  getBuildingData,
  getBuildingDataForLevel,
} from 'app/(game)/(village-slug)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import clsx from 'clsx';
import type React from 'react';
import { createContext, use } from 'react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useArtifacts } from 'app/(game)/(village-slug)/hooks/use-artifacts';
import { Text } from 'app/components/text';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { formatTime } from 'app/utils/time';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { Icon } from 'app/components/icon';
import { formatValue } from 'app/utils/common';
import type { BuildingField } from 'app/interfaces/models/game/village';

type BuildingCardContextState = {
  buildingId: Building['id'];
  building: Building;
};

export const BuildingCardContext = createContext<BuildingCardContextState>(
  {} as BuildingCardContextState,
);

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingCard: React.FCWithChildren<BuildingCardProps> = ({
  buildingId,
  children,
}) => {
  const building = getBuildingData(buildingId);

  return (
    <BuildingCardContext value={{ buildingId, building }}>
      <article className="flex flex-col gap-2 p-2 border border-border">
        {children}
      </article>
    </BuildingCardContext>
  );
};

export const BuildingOverview = () => {
  const { t: assetsT } = useTranslation();
  const { t } = useTranslation();
  const { buildingId } = use(BuildingCardContext);
  const { buildingFieldId } = useRouteSegments();
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
  const { buildingFieldId } = useRouteSegments();
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

type BuildingBenefitProps = {
  effect: CalculatedCumulativeEffect;
  isMaxLevel: boolean;
  buildingFieldId: BuildingField['id'];
};

const BuildingBenefit: React.FC<BuildingBenefitProps> = ({
  effect,
  isMaxLevel,
}) => {
  const type =
    effect.effectId === 'wheatProduction' && effect.currentLevelValue <= 0
      ? 'population'
      : effect.effectId;

  return (
    <span
      key={effect.effectId}
      className="flex gap-2"
    >
      <Icon
        type={type}
        className="size-6"
        variant={
          effect.areEffectValuesRising || type === 'population'
            ? 'positive-change'
            : 'negative-change'
        }
      />
      <span>
        {!isMaxLevel && effect.currentLevelValue !== effect.nextLevelValue && (
          <>
            {formatValue(
              Math.abs(
                !Number.isInteger(effect.currentLevelValue) &&
                  effect.currentLevelValue - effect.nextLevelValue < 0
                  ? effect.currentLevelValue - 1
                  : effect.currentLevelValue,
              ),
            )}
            <span className="mx-0.5">&rarr;</span>
          </>
        )}
        {formatValue(
          Math.abs(
            isMaxLevel ? effect.currentLevelValue : effect.nextLevelValue,
          ),
        )}
      </span>
    </span>
  );
};

export const BuildingBenefits = () => {
  const { t } = useTranslation();
  const { building, buildingId } = use(BuildingCardContext);
  const { buildingFieldId } = useRouteSegments();
  const { actualLevel, virtualLevel, doesBuildingExist } =
    useBuildingVirtualLevel(buildingId, buildingFieldId!);

  const { isMaxLevel } = getBuildingDataForLevel(buildingId, virtualLevel);

  const cumulativeEffects = calculateBuildingEffectValues(
    building,
    actualLevel,
  );

  const [population, ...rest] = cumulativeEffects;

  // In case we have both infantry and cavalry defence, we show combined defence icon instead
  const shouldCombineEffects =
    rest.length > 0 &&
    rest.every(
      ({ effectId }) =>
        effectId === 'infantryDefence' || effectId === 'cavalryDefence',
    );
  const effectsToShow = (() => {
    if (shouldCombineEffects) {
      const [infantryDefenceEffect, , infantryBonusEffect] = rest;

      const effects: CalculatedCumulativeEffect[] = [
        {
          ...infantryDefenceEffect,
          effectId: 'defenceBonus',
        } satisfies CalculatedCumulativeEffect,
      ];

      if (infantryBonusEffect) {
        effects.push({
          ...infantryBonusEffect,
          effectId: 'defence',
        } satisfies CalculatedCumulativeEffect);
      }

      return effects;
    }

    return rest;
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
        {(isMaxLevel ||
          population.currentLevelValue !== population.nextLevelValue) && (
          <BuildingBenefit
            effect={population}
            isMaxLevel={isMaxLevel}
            buildingFieldId={buildingFieldId!}
          />
        )}
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
  const { t: assetsT } = useTranslation();
  const { buildingId } = use(BuildingCardContext);
  const { tribe } = useTribe();
  const { playerVillages } = usePlayerVillages();
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();
  const { isGreatBuildingsArtifactActive } = useArtifacts();

  const { canBuild, assessedRequirements } =
    assessBuildingConstructionReadiness({
      buildingId,
      tribe,
      currentVillageBuildingEvents,
      playerVillages,
      currentVillage,
      isGreatBuildingsArtifactActive,
    });

  if (canBuild) {
    return null;
  }

  const { maxLevel } = getBuildingData(buildingId);

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
                <span
                  className={clsx(
                    assessedRequirement.fulfilled &&
                      'text-muted-foreground line-through',
                  )}
                >
                  {assessedRequirement.type === 'amount' &&
                    instanceAlreadyExists &&
                    t('{{building}} level {{level}}', {
                      building: assetsT(`BUILDINGS.${buildingId}.NAME`),
                      level: maxLevel,
                    })}
                  {assessedRequirement.type === 'building' &&
                    t('{{building}} level {{level}}', {
                      building: assetsT(
                        `BUILDINGS.${assessedRequirement.buildingId}.NAME`,
                      ),
                      level: assessedRequirement.level,
                    })}
                </span>
                {index !== requirementsToDisplay.length - 1 && ','}
              </li>
            </Fragment>
          ),
        )}
      </ul>
    </section>
  );
};
