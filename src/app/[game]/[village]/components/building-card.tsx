import { BuildingActions } from 'app/[game]/[village]/components/building-actions';
import { BuildingOverview } from 'app/[game]/[village]/components/building-overview';
import { type AssessedBuildingRequirement, assessBuildingConstructionReadiness } from 'app/[game]/[village]/utils/building-requirements';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useEvents } from 'app/[game]/hooks/use-events';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { specialFieldIds } from 'app/[game]/utils/building';
import clsx from 'clsx';
import type { Building } from 'interfaces/models/game/building';
import React from 'react';
import { useTranslation } from 'react-i18next';

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingCard: React.FC<BuildingCardProps> = ({ buildingId }) => {
  const { t } = useTranslation();
  const { tribe } = useTribe();
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { currentVillageBuildingEvents } = useEvents();

  const { canBuild, assessedRequirements } = assessBuildingConstructionReadiness({
    buildingId,
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
  });

  return (
    <article className="flex flex-col gap-4 p-4 border border-gray-500">
      <BuildingOverview buildingId={buildingId} />
      <BuildingActions buildingId={buildingId} />
      {/* Show building requirements if building can't be built */}
      {!canBuild && !specialFieldIds.includes(buildingFieldId!) && (
        <section>
          Requirements
          <ul className="flex gap-2">
            {assessedRequirements.map((assessedRequirement: AssessedBuildingRequirement, index) => (
              <React.Fragment key={assessedRequirement.id}>
                {['capital', 'building'].includes(assessedRequirement.type) && (
                  <li>
                    <span className={clsx(assessedRequirement.fulfilled && 'line-through')}>
                      {assessedRequirement.type === 'capital' && 'Capital'}
                      {assessedRequirement.type === 'building' &&
                        `${t(`BUILDINGS.${assessedRequirement.buildingId}.NAME`)} level ${assessedRequirement.level}`}
                      {index !== assessedRequirements.length - 1 && ','}
                    </span>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};
