import { BuildingActions } from 'app/(game)/(village)/components/building-actions';
import { BuildingOverview } from 'app/(game)/(village)/components/building-overview';
import { assessBuildingConstructionReadiness, type AssessedBuildingRequirement } from 'app/(game)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { getBuildingData, specialFieldIds } from 'app/(game)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import clsx from 'clsx';
import type React from 'react';
import { Fragment } from 'react';
import { Trans } from '@lingui/react/macro';
import { useArtifacts } from 'app/(game)/hooks/use-artifacts';

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingCard: React.FC<BuildingCardProps> = ({ buildingId }) => {
  const { tribe } = useTribe();
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { currentVillageBuildingEvents } = useEvents();
  const { isGreatBuildingsArtifactActive } = useArtifacts();

  const { maxLevel } = getBuildingData(buildingId);

  const { canBuild, assessedRequirements } = assessBuildingConstructionReadiness({
    buildingId,
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
    isGreatBuildingsArtifactActive,
  });

  const sameBuildingInstances = currentVillage.buildingFields.filter(({ buildingId: id }) => id === buildingId);
  const instanceAlreadyExists = sameBuildingInstances.length > 0;

  // We don't show tribal requirements
  const requirementsToDisplay = assessedRequirements.filter(({ type }) => {
    if (type === 'amount') {
      return instanceAlreadyExists;
    }

    return ['capital', 'building', 'amount'].includes(type);
  });

  return (
    <article className="flex flex-col p-2 md:p-4 border border-gray-500">
      <BuildingOverview
        buildingId={buildingId}
        titleCount={sameBuildingInstances.length}
      />
      <BuildingActions buildingId={buildingId} />
      {/* Show building requirements if building can't be built */}
      {!canBuild && !specialFieldIds.includes(buildingFieldId!) && (
        <section className="flex flex-col border-t border-gray-200 pt-2 gap-2">
          <h3 className="font-medium"><Trans>Requirements</Trans></h3>
          <ul className="flex gap-x-2 flex-wrap">
            {requirementsToDisplay.map((assessedRequirement: AssessedBuildingRequirement, index) => {
              const { name } = getBuildingData(buildingId);
              return (
                <Fragment key={assessedRequirement.id}>
                  <li className="whitespace-nowrap">
                    <span className={clsx(assessedRequirement.fulfilled && 'line-through')}>
                      {assessedRequirement.type === 'amount' && instanceAlreadyExists && (
                        <Trans>
                          {name.message} level {maxLevel}
                        </Trans>
                      )}
                      {assessedRequirement.type === 'capital' && 'Capital'}
                      {assessedRequirement.type === 'building' && (
                        <Trans>
                          {getBuildingData(assessedRequirement.buildingId).name.message} level {assessedRequirement.level}
                        </Trans>
                      )}
                      {index !== requirementsToDisplay.length - 1 && ','}
                    </span>
                  </li>
                </Fragment>
              )
            })}
          </ul>
        </section>
      )}
    </article>
  );
};
