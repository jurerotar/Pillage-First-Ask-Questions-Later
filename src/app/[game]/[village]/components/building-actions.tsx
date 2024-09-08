import { useBuildingActions } from 'app/[game]/[village]/hooks/use-building-actions';
import { useBuildingVirtualLevel } from 'app/[game]/[village]/hooks/use-building-virtual-level';
import { assessBuildingConstructionReadiness } from 'app/[game]/[village]/utils/building-requirements';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useEvents } from 'app/[game]/hooks/use-events';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { useCurrentResources } from 'app/[game]/providers/current-resources-provider';
import { getBuildingDataForLevel, specialFieldIds } from 'app/[game]/utils/building';
import { Button } from 'app/components/buttons/button';
import type { Building } from 'interfaces/models/game/building';
import type React from 'react';
import { useNavigate } from 'react-router-dom';

type BuildingCardProps = {
  buildingId: Building['id'];
};

export const BuildingActions: React.FC<BuildingCardProps> = ({ buildingId }) => {
  const navigate = useNavigate();
  const { tribe } = useTribe();
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { currentVillageBuildingEvents, canAddAdditionalBuildingToQueue } = useEvents();
  const { wood, clay, iron, wheat } = useCurrentResources();
  const { constructBuilding, upgradeBuilding, downgradeBuilding, demolishBuilding } = useBuildingActions(buildingId, buildingFieldId!);
  const { buildingLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId!);
  const { nextLevelResourceCost } = getBuildingDataForLevel(buildingId, buildingLevel);

  const doesBuildingExist = buildingLevel > 0 || specialFieldIds.includes(buildingFieldId!);
  const canDemolishBuildings = (currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0) >= 10;

  const { canBuild } = assessBuildingConstructionReadiness({
    buildingId,
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
  });

  const hasEnoughResourcesToBuild = (() => {
    return (
      wood >= nextLevelResourceCost[0] &&
      clay >= nextLevelResourceCost[1] &&
      iron >= nextLevelResourceCost[2] &&
      wheat >= nextLevelResourceCost[3]
    );
  })();

  const onBuildingConstruction = () => {
    constructBuilding();
    navigate('..');
  };

  const onBuildingUpgrade = () => {
    upgradeBuilding();
    navigate('..');
  };

  const onBuildingDowngrade = () => {
    downgradeBuilding();
    navigate('..');
  };

  const onBuildingDemolish = () => {
    demolishBuilding();
    navigate('..');
  };

  return (
    <section className="flex flex-col gap-4 py-2 justify-center">
      {doesBuildingExist && (
        <>
          <Button
            variant="confirm"
            onClick={onBuildingUpgrade}
            disabled={!(canAddAdditionalBuildingToQueue && hasEnoughResourcesToBuild)}
          >
            Upgrade to level {buildingLevel + 1}
          </Button>
          {canDemolishBuildings && (
            <>
              {buildingLevel > 1 && (
                <Button
                  variant="confirm"
                  onClick={onBuildingDowngrade}
                >
                  Downgrade by 1 level
                </Button>
              )}
              <Button
                variant="confirm"
                onClick={onBuildingDemolish}
              >
                Demolish completely
              </Button>
            </>
          )}
        </>
      )}
      {!doesBuildingExist && canBuild && (
        <Button
          variant="confirm"
          onClick={onBuildingConstruction}
          disabled={!(canAddAdditionalBuildingToQueue && hasEnoughResourcesToBuild)}
        >
          Construct
        </Button>
      )}
    </section>
  );
};
