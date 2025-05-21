import { BuildingActions } from 'app/(game)/(village-slug)/(village)/components/building-actions';
import { BuildingOverview } from 'app/(game)/(village-slug)/(village)/components/building-overview';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
import { Text } from 'app/components/text';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import {
  BuildingSection,
  BuildingSectionContent,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/building-layout';
import { Skeleton } from 'app/components/ui/skeleton';

const BuildingTabFallback = () => {
  return (
    <BuildingSection>
      <BuildingSectionContent>
        <Skeleton className="flex w-60 h-6" />
        <Skeleton className="flex w-full h-16" />
      </BuildingSectionContent>
      <BuildingSectionContent>
        <Skeleton className="flex w-full h-30" />
      </BuildingSectionContent>
    </BuildingSection>
  );
};

const BuildingStats = lazy(async () => ({
  default: (await import('./components/building-stats')).BuildingStats,
}));

const MainBuildingVillageManagement = lazy(async () => ({
  default: (await import('./components/main-building-village-management')).MainBuildingVillageManagement,
}));

const RallyPointIncomingTroops = lazy(async () => ({
  default: (await import('./components/rally-point-incoming-troops')).RallyPointIncomingTroops,
}));

const RallyPointSendTroops = lazy(async () => ({
  default: (await import('./components/rally-point-send-troops')).RallyPointSendTroops,
}));

const RallyPointSimulator = lazy(async () => ({
  default: (await import('./components/rally-point-simulator')).RallyPointSimulator,
}));

const PalaceTrainSettler = lazy(async () => ({
  default: (await import('./components/palace-settler-training')).PalaceSettlerTraining,
}));

const PalaceLoyalty = lazy(async () => ({
  default: (await import('./components/palace-loyalty')).PalaceLoyalty,
}));

const PalaceExpansion = lazy(async () => ({
  default: (await import('./components/palace-expansion')).PalaceExpansion,
}));

const TreasuryArtifacts = lazy(async () => ({
  default: (await import('./components/treasury-artifacts')).TreasuryArtifacts,
}));

const MarketplaceBuy = lazy(async () => ({
  default: (await import('./components/marketplace-trade')).MarketplaceTrade,
}));

const MarketplaceTradeRoutes = lazy(async () => ({
  default: (await import('./components/marketplace-trade-routes')).MarketplaceTradeRoutes,
}));

const AcademyUnitResearch = lazy(async () => ({
  default: (await import('./components/academy-unit-research')).AcademyUnitResearch,
}));

const SmithyUnitImprovement = lazy(async () => ({
  default: (await import('./components/smithy-unit-improvement')).SmithyUnitImprovement,
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

const palaceTabs = new Map<string, React.LazyExoticComponent<() => React.JSX.Element>>([
  [t('Train settlers'), PalaceTrainSettler],
  [t('Loyalty'), PalaceLoyalty],
  [t('Expansion'), PalaceExpansion],
]);

const buildingDetailsTabMap = new Map<Building['id'], Map<string, React.LazyExoticComponent<() => React.JSX.Element>>>([
  ['MAIN_BUILDING', new Map([[t('Village management'), MainBuildingVillageManagement]])],
  [
    'RALLY_POINT',
    new Map([
      [t('Troop movements'), RallyPointIncomingTroops],
      [t('Send troops'), RallyPointSendTroops],
      [t('Simulator'), RallyPointSimulator],
    ]),
  ],
  ['TREASURY', new Map([[t('Artifacts'), TreasuryArtifacts]])],
  [
    'MARKETPLACE',
    new Map([
      [t('Trade'), MarketplaceBuy],
      [t('Trade routes'), MarketplaceTradeRoutes],
    ]),
  ],
  ['ACADEMY', new Map([[t('Unit research'), AcademyUnitResearch]])],
  ['SMITHY', new Map([[t('Unit improvement'), SmithyUnitImprovement]])],
  ['RESIDENCE', palaceTabs],
  ['COMMAND_CENTER', palaceTabs],
  ['HEROS_MANSION', new Map([[t('Oasis'), HerosMansionOasis]])],
  ['BREWERY', new Map([[t('Celebration'), BreweryCelebration]])],
  ['BARRACKS', new Map([[t('Train'), BarracksTroopTraining]])],
  ['GREAT_BARRACKS', new Map([[t('Train'), GreatBarracksTroopTraining]])],
  ['STABLE', new Map([[t('Train'), StableTroopTraining]])],
  ['GREAT_STABLE', new Map([[t('Train'), GreatStableTroopTraining]])],
  ['WORKSHOP', new Map([[t('Train'), WorkshopTroopTraining]])],
  ['HOSPITAL', new Map([[t('Train'), HospitalTroopTraining]])],
]);

export const BuildingDetails = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { buildingId } = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!)!;
  const { villagePath, resourcesPath } = useGameNavigation();
  const { actualLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId!);

  const parentLink = buildingFieldId! > 18 ? villagePath : resourcesPath;

  const tabs = Array.from([
    'default',
    ...(buildingDetailsTabMap.get(buildingId)?.keys() ?? []).filter((tabName) => tabName !== 'default'),
    'upgrade-cost',
  ]);

  const buildingSpecificTabs = tabs.filter((tab: string) => !['default', 'upgrade-cost'].includes(tab));

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={parentLink}>{buildingFieldId! > 18 ? t('Village') : t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{assetsT(`BUILDINGS.${buildingId}.NAME`)}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">
        {assetsT(`BUILDINGS.${buildingId}.NAME`)} - {t('level {{level}}', { level: actualLevel })}
      </Text>
      <div className="flex flex-col gap-2">
        <Tabs
          selectedIndex={tabIndex}
          onSelect={(index) => {
            const tab = tabs[index];
            navigateToTab(tab);
          }}
        >
          <TabList>
            <Tab>{t('Overview')}</Tab>
            {buildingSpecificTabs.map((name: string) => (
              <Tab key={name}>{name}</Tab>
            ))}
            <Tab>{t('Upgrade details')}</Tab>
          </TabList>
          <TabPanel>
            <BuildingSection>
              <BuildingSectionContent>
                <Text as="h2">{t('{{buildingName}} overview', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`) })}</Text>
                <BuildingOverview buildingId={buildingId} />
                <BuildingActions buildingId={buildingId} />
              </BuildingSectionContent>
            </BuildingSection>
          </TabPanel>
          {buildingSpecificTabs.map((name: string) => {
            const Panel = buildingDetailsTabMap.get(buildingId)!.get(name)!;
            return (
              <TabPanel key={name}>
                <Suspense fallback={<BuildingTabFallback />}>
                  <Panel />
                </Suspense>
              </TabPanel>
            );
          })}
          <TabPanel>
            <Suspense fallback={<BuildingTabFallback />}>
              <BuildingStats />
            </Suspense>
          </TabPanel>
        </Tabs>
      </div>
    </>
  );
};
