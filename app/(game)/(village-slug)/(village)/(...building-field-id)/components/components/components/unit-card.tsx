import {
  type AssessedResearchRequirement,
  assessUnitResearchReadiness,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/utils/unit-research-requirements';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { useUnitImprovement } from 'app/(game)/(village-slug)/hooks/use-unit-improvement';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { CurrentResourceContext } from 'app/(game)/(village-slug)/providers/current-resources-provider';
import { Button } from 'app/components/ui/button';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import type { Unit } from 'app/interfaces/models/game/unit';
import clsx from 'clsx';
import type React from 'react';
import { Fragment, use } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateMaxUnits, calculateUnitResearchCost, getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useForm } from 'react-hook-form';
import { Text } from 'app/components/text';

const UnitResearch: React.FC<Pick<UnitCardProps, 'unitId'>> = ({ unitId }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { isUnitResearched } = useUnitResearch();
  const researchCost = calculateUnitResearchCost(unitId);

  const hasResearchedUnit = isUnitResearched(unitId);

  return (
    <section className="flex flex-col gap-2 pt-2 border-t border-gray-200">
      <Text as="h3">{hasResearchedUnit ? t('Research') : t('Research cost')}</Text>
      {hasResearchedUnit && (
        <span className="text-green-600 font-semibold">
          {t('{{unit}} researched', { unit: assetsT(`UNITS.${unitId}.NAME`, { count: 1 }) })}
        </span>
      )}
      {!hasResearchedUnit && (
        <Resources
          className="flex-wrap"
          resources={researchCost!}
        />
      )}
    </section>
  );
};

type UnitRecruitmentFormProps = {
  amount: number;
};

const UnitRecruitment: React.FC<Pick<UnitCardProps, 'unitId'>> = ({ unitId }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { createBulkEvent: createBulkBarracksTrainingEvent } = useCreateEvent('troopTraining');
  const currentResources = use(CurrentResourceContext);
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const { handleSubmit: _handleSubmit } = useForm<UnitRecruitmentFormProps>();

  const { baseRecruitmentCost } = getUnitData(unitId);

  const _maxUnits = calculateMaxUnits(currentResources, baseRecruitmentCost);

  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!);

  const isUnitRecruitmentOpenInGreatBuilding = buildingField?.buildingId?.includes('GREAT') ?? false;

  const unitCostModifier = isUnitRecruitmentOpenInGreatBuilding ? 3 : 1;

  const __recruitUnits = (amount: number) => {
    createBulkBarracksTrainingEvent({
      buildingId: 'BARRACKS',
      amount,
      unitId: 'PHALANX',
      startsAt: Date.now() + 10000,
      duration: 1000,
      resourceCost: [0, 0, 0, 0].map((cost) => cost * unitCostModifier),
    });
  };

  return (
    <section className="pt-2 flex flex-col gap-2 border-t border-gray-200">
      <Text as="h3">{t('Available actions')}</Text>
      <Button
        onClick={() => __recruitUnits(0)}
        variant="default"
      >
        {t('Train {{count}} {{unit}} units', { unit: assetsT(`UNITS.${unitId}.NAME`, { count: 1 }), count: 1 })}
      </Button>
    </section>
  );
};

type UnitCardProps = {
  unitId: Unit['id'];
  showRequirements?: boolean;
  showResearch?: boolean;
  showImprovementLevel?: boolean;
  showAttributes?: boolean;
  showUnitCost?: boolean;
  showUnitRecruitmentForm?: boolean;
  showOuterBorder?: boolean;
};

type UnitAttributes = Record<
  'attack' | 'infantryDefence' | 'cavalryDefence' | 'unitSpeed' | 'unitCarryCapacity' | 'unitWheatConsumption',
  number
>;

export const UnitCard: React.FC<UnitCardProps> = (props) => {
  const {
    unitId,
    showRequirements = false,
    showResearch = false,
    showImprovementLevel = false,
    showAttributes = false,
    showUnitCost = false,
    showUnitRecruitmentForm = false,
    showOuterBorder = true,
  } = props;
  const { t: assetsT } = useTranslation();
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { unitImprovements } = useUnitImprovement();
  const { isDeveloperModeActive } = useDeveloperMode();
  const { wood, clay, iron, wheat } = use(CurrentResourceContext);
  const { researchUnit, isUnitResearched } = useUnitResearch();

  const { tier, baseRecruitmentCost, attack, infantryDefence, cavalryDefence, unitSpeed, unitCarryCapacity, unitWheatConsumption } =
    getUnitData(unitId)!;
  const researchCost = calculateUnitResearchCost(unitId);
  const { canResearch } = assessUnitResearchReadiness(unitId, currentVillage);

  const unitImprovement = unitImprovements.find((unitImprovement) => unitImprovement.tier === tier);
  const hasResearchedUnit = isUnitResearched(unitId);
  const shouldShowUnitLevel = tier !== 'special' && showImprovementLevel;

  const { assessedRequirements } = assessUnitResearchReadiness(unitId, currentVillage);

  const hasEnoughResourcesToResearch = (() => {
    if (isDeveloperModeActive) {
      return true;
    }

    return wood >= researchCost![0] && clay >= researchCost![1] && iron >= researchCost![2] && wheat >= researchCost![3];
  })();

  const canResearchUnit = hasEnoughResourcesToResearch && canResearch;

  const attributes: UnitAttributes = {
    attack,
    infantryDefence,
    cavalryDefence,
    unitSpeed,
    unitCarryCapacity,
    unitWheatConsumption,
  };

  return (
    <article className={clsx('flex flex-col gap-2 p-2', showOuterBorder && 'border border-gray-500')}>
      <section>
        <div className="inline-flex gap-2 items-center font-semibold">
          <Text as="h2">{assetsT(`UNITS.${unitId}.NAME`, { count: 1 })}</Text>
          {shouldShowUnitLevel && (
            <span className="text-sm text-orange-500">{t('Level {{level}}', { level: unitImprovement!.level })}</span>
          )}
        </div>
        <div className="flex justify-center items-center mr-1 mb-1 float-left size-10">
          <Icon
            className="size-full"
            type={unitIdToUnitIconMapper(unitId)}
          />
        </div>
        <Text as="p">{assetsT(`UNITS.${unitId}.DESCRIPTION`)}</Text>
      </section>

      {showUnitCost && (
        <section className="flex flex-col gap-2 pt-2 border-t border-gray-200">
          <Text as="h3">{t('Unit cost')}</Text>
          <Resources
            className="flex-wrap"
            resources={baseRecruitmentCost}
          />
        </section>
      )}

      {showAttributes && (
        <section className="flex flex-col gap-2 pt-2 border-t border-gray-200">
          <Text as="h3">{t('Attributes')}</Text>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(attributes) as (keyof UnitAttributes)[]).map((attribute) => (
              <span
                key={attribute}
                className="inline-flex whitespace-nowrap gap-2 items-center"
              >
                <Icon
                  className="size-5"
                  type={attribute}
                />
                {attributes[attribute]}
              </span>
            ))}
          </div>
        </section>
      )}

      {showResearch && <UnitResearch unitId={unitId} />}

      {showRequirements && !canResearch && (
        <section className="pt-2 flex flex-col gap-2 border-t border-gray-200">
          <Text as="h3">{t('Requirements')}</Text>
          <ul className="flex gap-2 flex-wrap">
            {assessedRequirements.map((assessedRequirement: AssessedResearchRequirement, index) => (
              <Fragment key={assessedRequirement.buildingId}>
                <li className="whitespace-nowrap">
                  <span className={clsx(assessedRequirement.fulfilled && 'line-through')}>
                    {assetsT(`BUILDINGS.${assessedRequirement.buildingId}.NAME`)}{' '}
                    {t('level {{level}}', { level: assessedRequirement.level })}
                  </span>
                  {index !== assessedRequirements.length - 1 && ','}
                </li>
              </Fragment>
            ))}
          </ul>
        </section>
      )}

      {showUnitRecruitmentForm && hasResearchedUnit && <UnitRecruitment unitId={unitId} />}

      {showResearch && canResearch && !hasResearchedUnit && (
        <section className="pt-2 flex flex-col gap-2 border-t border-gray-200">
          <Text as="h3">{t('Available actions')}</Text>
          <Button
            onClick={() => researchUnit(unitId)}
            variant="default"
            disabled={!canResearchUnit}
          >
            {t('Research {{unit}}', { unit: assetsT(`UNITS.${unitId}.NAME`, { count: 1 }) })}
          </Button>
        </section>
      )}
    </article>
  );
};
