import { BuildingActions } from 'app/[game]/[village]/components/building-actions';
import { BuildingOverview } from 'app/[game]/[village]/components/building-overview';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/building';
import { StyledTab } from 'app/components/styled-tab';
import type { Building } from 'interfaces/models/game/building';
import type React from 'react';
import { Suspense, lazy, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabList, TabPanel, Tabs } from 'react-tabs';

const RallyPointIncomingTroops = lazy(async () => ({
  default: (await import('./components/rally-point-incoming-troops')).RallyPointIncomingTroops,
}));

const RallyPointSendTroops = lazy(async () => ({
  default: (await import('./components/rally-point-send-troops')).RallyPointSendTroops,
}));

const RallyPointSimulator = lazy(async () => ({
  default: (await import('./components/rally-point-simulator')).RallyPointSimulator,
}));

const RallyPointFarmList = lazy(async () => ({
  default: (await import('./components/rally-point-farm-list')).RallyPointFarmList,
}));

const PalaceTrainSettler = lazy(async () => ({
  default: (await import('./components/palace-train-settler')).PalaceTrainSettler,
}));

const PalaceLoyalty = lazy(async () => ({
  default: (await import('./components/palace-loyalty')).PalaceLoyalty,
}));

const PalaceExpansion = lazy(async () => ({
  default: (await import('./components/palace-expansion')).PalaceExpansion,
}));

const TreasuryVillageArtifact = lazy(async () => ({
  default: (await import('./components/treasury-village-artifact')).TreasuryVillageArtifact,
}));

const TreasuryUnconqueredArtifact = lazy(async () => ({
  default: (await import('./components/treasury-unconquered-artifacts')).TreasuryUnconqueredArtifact,
}));

const MarketplaceBuy = lazy(async () => ({
  default: (await import('./components/marketplace-buy')).MarketplaceBuy,
}));

const MarketplaceTradeRoutes = lazy(async () => ({
  default: (await import('./components/marketplace-trade-routes')).MarketplaceTradeRoutes,
}));

const AcademyUnitResearch = lazy(async () => ({
  default: (await import('./components/academy-unit-research')).AcademyUnitResearch,
}));

const AcademyUnitImprovement = lazy(async () => ({
  default: (await import('./components/academy-unit-improvement')).AcademyUnitImprovement,
}));

const HerosMansionOasis = lazy(async () => ({
  default: (await import('./components/heros-mansion-oasis')).HerosMansionOasis,
}));

const BreweryCelebration = lazy(async () => ({
  default: (await import('./components/brewery-celebrations')).BreweryCelebration,
}));

const BarracksTroopTraining = lazy(async () => ({
  default: (await import('./components/barracks-troop-training')).BarracksTroopTraining,
}));

const GreatBarracksTroopTraining = lazy(async () => ({
  default: (await import('./components/great-barracks-troop-training')).GreatBarracksTroopTraining,
}));

const StableTroopTraining = lazy(async () => ({
  default: (await import('./components/stable-troop-training')).StableTroopTraining,
}));

const GreatStableTroopTraining = lazy(async () => ({
  default: (await import('./components/great-stable-troop-training')).GreatStableTroopTraining,
}));

const WorkshopTroopTraining = lazy(async () => ({
  default: (await import('./components/workshop-troop-training')).WorkshopTroopTraining,
}));

const HospitalTroopTraining = lazy(async () => ({
  default: (await import('./components/hospital-troop-training')).HospitalTroopTraining,
}));

const palaceTabs = new Map<string, React.LazyExoticComponent<() => JSX.Element>>([
  ['default', PalaceTrainSettler],
  ['LOYALTY', PalaceLoyalty],
  ['EXPANSION', PalaceExpansion],
]);

const buildingDetailsTabMap = new Map<Building['id'], Map<string, React.LazyExoticComponent<() => JSX.Element>>>([
  [
    'RALLY_POINT',
    new Map([
      ['default', RallyPointIncomingTroops],
      ['SEND_TROOPS', RallyPointSendTroops],
      ['SIMULATOR', RallyPointSimulator],
      ['FARM_LIST', RallyPointFarmList],
    ]),
  ],
  [
    'TREASURY',
    new Map([
      ['default', TreasuryVillageArtifact],
      ['TREASURY', TreasuryUnconqueredArtifact],
    ]),
  ],
  [
    'MARKETPLACE',
    new Map([
      ['default', MarketplaceBuy],
      ['TRADE_ROUTES', MarketplaceTradeRoutes],
    ]),
  ],
  [
    'ACADEMY',
    new Map([
      ['default', AcademyUnitResearch],
      ['UNIT_IMPROVEMENT', AcademyUnitImprovement],
    ]),
  ],
  ['PALACE', palaceTabs],
  ['RESIDENCE', palaceTabs],
  ['COMMAND_CENTER', palaceTabs],
  ['HEROS_MANSION', new Map([['default', HerosMansionOasis]])],
  ['BREWERY', new Map([['default', BreweryCelebration]])],
  ['BARRACKS', new Map([['default', BarracksTroopTraining]])],
  ['GREAT_BARRACKS', new Map([['default', GreatBarracksTroopTraining]])],
  ['STABLE', new Map([['default', StableTroopTraining]])],
  ['GREAT_STABLE', new Map([['default', GreatStableTroopTraining]])],
  ['WORKSHOP', new Map([['default', WorkshopTroopTraining]])],
  ['HOSPITAL', new Map([['default', HospitalTroopTraining]])],
]);

export const BuildingDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { buildingId } = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!)!;

  const hasAdditionalContent = buildingDetailsTabMap.has(buildingId);
  const MainTabAdditionalContent = hasAdditionalContent ? buildingDetailsTabMap.get(buildingId)!.get('default')! : null;

  const tabs = Array.from(buildingDetailsTabMap.get(buildingId)?.keys() ?? []).filter((tabName) => tabName !== 'default');

  const tabNameToIndex = {
    default: 0,
    ...tabs.reduce(
      (acc, name, idx) => {
        acc[name] = idx + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    'upgrade-cost': tabs.length + 1,
  };

  // @ts-ignore - TODO: Fix when you find time for this
  const [tabIndex, setTabIndex] = useState<number>(tabNameToIndex[searchParams.get('tab') ?? 'default']);

  return (
    <article className="flex flex-col gap-4 py-2">
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => setTabIndex(index)}
      >
        <TabList className="flex">
          <StyledTab>Overview</StyledTab>
          {tabs.map((name: string) => (
            <StyledTab key={name}>{name}</StyledTab>
          ))}
          <StyledTab>Upgrade cost</StyledTab>
        </TabList>
        <TabPanel>
          <BuildingOverview buildingId={buildingId} />
          <BuildingActions buildingId={buildingId} />
          <Suspense fallback={<>Loading tab</>}>{MainTabAdditionalContent ? <MainTabAdditionalContent /> : null}</Suspense>
        </TabPanel>
        {tabs.map((name: string) => {
          const Panel = buildingDetailsTabMap.get(buildingId)!.get(name)!;
          return (
            <TabPanel key={name}>
              <Suspense fallback={<>Loading tab</>}>{<Panel />}</Suspense>
            </TabPanel>
          );
        })}
        <TabPanel>Resource cost</TabPanel>
      </Tabs>
    </article>
  );
};
