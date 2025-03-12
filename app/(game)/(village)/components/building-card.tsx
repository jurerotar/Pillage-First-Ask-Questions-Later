import { BuildingActions } from 'app/(game)/(village)/components/building-actions';
import { BuildingOverview } from 'app/(game)/(village)/components/building-overview';
import { assessBuildingConstructionReadiness, type AssessedBuildingRequirement } from 'app/(game)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { getBuildingData, specialFieldIds } from 'app/(game)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import clsx from 'clsx';
import type React from 'react';
import { Fragment, use } from 'react';
import { useTranslation } from 'react-i18next';
import { useArtifacts } from 'app/(game)/hooks/use-artifacts';

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingCard: React.FC<BuildingCardProps> = ({ buildingId }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { tribe } = useTribe();
  const { getPlayerVillages } = useVillages();
  const { currentVillage } = use(CurrentVillageContext);
  const { buildingFieldId } = useRouteSegments();
  const { getCurrentVillageBuildingEvents } = useEvents();
  const { isGreatBuildingsArtifactActive } = useArtifacts();

  const playerVillages = getPlayerVillages();
  const { maxLevel } = getBuildingData(buildingId);
  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);

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
          <h3 className="font-medium">{t('Requirements')}</h3>
          <ul className="flex gap-x-2 flex-wrap">
            {requirementsToDisplay.map((assessedRequirement: AssessedBuildingRequirement, index) => (
              <Fragment key={assessedRequirement.id}>
                <li className="whitespace-nowrap">
                  <span className={clsx(assessedRequirement.fulfilled && 'line-through')}>
                    {assessedRequirement.type === 'amount' &&
                      instanceAlreadyExists &&
                      t('{{building}} level {{level}}', { building: assetsT(`BUILDINGS.${buildingId}.NAME`), level: maxLevel })}
                    {assessedRequirement.type === 'capital' && t('Capital')}
                    {assessedRequirement.type === 'building' &&
                      t('{{building}} level {{level}}', {
                        building: assetsT(`BUILDINGS.${assessedRequirement.buildingId}.NAME`),
                        level: assessedRequirement.level,
                      })}
                    {index !== requirementsToDisplay.length - 1 && ','}
                  </span>
                </li>
              </Fragment>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};
