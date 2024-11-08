import {
  type AssessedResearchRequirement,
  assessUnitResearchReadiness,
} from 'app/(game)/(village)/(...building-field-id)/components/components/utils/unit-research-requirements';
import { Resources } from 'app/(game)/components/resources';
import { useCreateEvent } from 'app/(game)/hooks/use-create-event';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { useUnitImprovement } from 'app/(game)/hooks/use-unit-improvement';
import { useUnitResearch } from 'app/(game)/hooks/use-unit-research';
import { useCurrentResources } from 'app/(game)/providers/current-resources-provider';
import { unitsMap } from 'app/assets/units';
import { Button } from 'app/components/buttons/button';
import { Icon, type IconType, unitIdToUnitIconMapper } from 'app/components/icon';
import { GameEventType } from 'app/interfaces/models/events/game-event';
import type { Unit } from 'app/interfaces/models/game/unit';
import clsx from 'clsx';
import type React from 'react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

const UnitResearch: React.FC<Pick<UnitCardProps, 'unitId'>> = ({ unitId }) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.ACADEMY.UNIT_RESEARCH.RESEARCH',
  });
  const { t: generalT } = useTranslation();
  const { isUnitResearched } = useUnitResearch();
  const { researchCost } = unitsMap.get(unitId)!;

  const hasResearchedUnit = isUnitResearched(unitId);

  return (
    <section className="flex flex-col gap-2 py-2 border-t border-gray-200">
      <h2 className="font-medium">{t(hasResearchedUnit ? 'HAS_RESEARCHED_TITLE' : 'HAS_NOT_RESEARCHED_TITLE')}</h2>
      {hasResearchedUnit && <span className="text-green-600">{t('UNIT_RESEARCHED', { unit: generalT(`UNITS.${unitId}.NAME`) })}</span>}
      {!hasResearchedUnit && (
        <Resources
          className="flex-wrap"
          resources={researchCost!}
        />
      )}
    </section>
  );
};

const UnitRecruitment: React.FC<Pick<UnitCardProps, 'unitId'>> = ({ unitId }) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.ACADEMY.UNIT_RESEARCH.RESEARCH',
  });
  const { t: generalT } = useTranslation();
  const { isUnitResearched } = useUnitResearch();
  const { createBulkEvent: createBulkBarracksTrainingEvent } = useCreateEvent(GameEventType.TROOP_TRAINING);

  const _hasResearchedUnit = isUnitResearched(unitId);

  // Great barracks and great stable require 3x the normal unit cost
  // @ts-ignore
  const unitCostModifier = 1;

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
      <h2 className="font-medium">{t('ACTIONS.TITLE')}</h2>
      <Button
        onClick={() => __recruitUnits(0)}
        variant="confirm"
      >
        {t('ACTIONS.BUTTON', { unit: generalT(`UNITS.${unitId}.NAME`) })}
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
  showRecruitment?: boolean;
  showUnitRecruitmentForm?: boolean;
};

export const UnitCard: React.FC<UnitCardProps> = (props) => {
  const {
    unitId,
    showRequirements = false,
    showResearch = false,
    showImprovementLevel = false,
    showAttributes = false,
    showUnitCost = false,
    showUnitRecruitmentForm = false,
  } = props;

  const { t: generalT } = useTranslation();
  const { t } = useTranslation('translation', {
    keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.ACADEMY.UNIT_RESEARCH',
  });
  const { currentVillage } = useCurrentVillage();
  const { unitImprovements } = useUnitImprovement();
  const { isDeveloperModeActive } = useDeveloperMode();
  const { wood, clay, iron, wheat } = useCurrentResources();
  const { researchUnit, isUnitResearched } = useUnitResearch();

  const { tier, baseRecruitmentCost, attack, infantryDefence, cavalryDefence, travelSpeed, carryCapacity, cropConsumption, researchCost } =
    unitsMap.get(unitId)!;

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

  const attributes = {
    attack,
    infantryDefence,
    cavalryDefence,
    travelSpeed,
    carryCapacity,
    cropConsumption,
  };

  return (
    <article className="flex flex-col p-2 border border-gray-500">
      <section className="pb-2">
        <div className="inline-flex gap-2 items-center font-semibold">
          <h2 className="text-xl">{generalT(`UNITS.${unitId}.NAME`)}</h2>
          {shouldShowUnitLevel && (
            <span className="text-sm text-orange-500">{generalT('GENERAL.LEVEL', { level: unitImprovement!.level })}</span>
          )}
        </div>
        <div className="flex justify-center items-center mr-1 mb-1 float-left size-10 md:size-14">
          <Icon
            className="size-full"
            type={unitIdToUnitIconMapper(unitId)}
          />
        </div>
        <p className="text-sm text-gray-500">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad aspernatur corporis, dolorum ex fuga impedit libero quo repellat
          totam voluptas.
          {/* {generalT(`UNITS.${unitId}.DESCRIPTION`)} */}
        </p>
      </section>

      {showUnitCost && (
        <section className="flex flex-col gap-2 py-2 border-t border-gray-200">
          <h2 className="font-medium">{t('UNIT_COST.TITLE')}</h2>
          <Resources
            className="flex-wrap"
            resources={baseRecruitmentCost}
          />
        </section>
      )}

      {showAttributes && (
        <section className="flex flex-col gap-2 py-2 border-t border-gray-200">
          <h2 className="font-medium">{t('ATTRIBUTES.TITLE')}</h2>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(attributes).map((attribute) => (
              <span
                key={attribute}
                className="inline-flex whitespace-nowrap gap-2 items-center"
              >
                <Icon
                  className="size-5"
                  type={attribute as IconType}
                />
                {/* @ts-ignore - TODO: This needs typing, I can't be bothered at the moment */}
                {attributes[attribute]}
              </span>
            ))}
          </div>
        </section>
      )}

      {showResearch && <UnitResearch unitId={unitId} />}

      {showRequirements && !canResearch && (
        <section className="py-2 flex flex-col gap-2 border-t border-gray-200">
          <h2 className="font-medium">{t('REQUIREMENTS.TITLE')}</h2>
          <ul className="flex gap-2 flex-wrap">
            {assessedRequirements.map((assessedRequirement: AssessedResearchRequirement, index) => (
              <Fragment key={assessedRequirement.buildingId}>
                <li className="whitespace-nowrap">
                  <span className={clsx(assessedRequirement.fulfilled && 'line-through')}>
                    {generalT(`BUILDINGS.${assessedRequirement.buildingId}.NAME`)}{' '}
                    {generalT('GENERAL.LEVEL', { level: assessedRequirement.level }).toLowerCase()}
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
          <h2 className="font-medium">{t('ACTIONS.TITLE')}</h2>
          <Button
            onClick={() => researchUnit(unitId)}
            variant="confirm"
            disabled={!canResearchUnit}
          >
            {t('ACTIONS.BUTTON', { unit: generalT(`UNITS.${unitId}.NAME`) })}
          </Button>
        </section>
      )}
    </article>
  );
};
