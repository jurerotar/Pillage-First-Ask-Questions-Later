import type { Building } from 'app/interfaces/models/game/building';
import { type JSX, type LazyExoticComponent, use } from 'react';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Skeleton } from 'app/components/ui/skeleton';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  BuildingBenefits,
  BuildingCard,
  BuildingCost,
  BuildingOverview,
  BuildingUnfinishedNotice,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card';
import { BuildingActions } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-actions';

const BuildingTabFallback = () => {
  return (
    <Section>
      <SectionContent>
        <Skeleton className="flex w-60 h-6" />
        <Skeleton className="flex w-full h-16" />
      </SectionContent>
      <SectionContent>
        <Skeleton className="flex w-full h-30" />
      </SectionContent>
    </Section>
  );
};

const BuildingStats = lazy(async () => ({
  default: (await import('./components/building-stats')).BuildingStats,
}));

const MainBuildingVillageManagement = lazy(async () => ({
  default: (await import('./components/main-building-village-management'))
    .MainBuildingVillageManagement,
}));

const RallyPointTroopMovements = lazy(async () => ({
  default: (await import('./components/rally-point-troop-movements'))
    .RallyPointTroopMovements,
}));

const RallyPointSendTroops = lazy(async () => ({
  default: (await import('./components/rally-point-send-troops'))
    .RallyPointSendTroops,
}));

const RallyPointSimulator = lazy(async () => ({
  default: (await import('./components/rally-point-simulator'))
    .RallyPointSimulator,
}));

const PalaceTrainSettler = lazy(async () => ({
  default: (await import('./components/palace-settler-training'))
    .PalaceSettlerTraining,
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

const EmbassyRelations = lazy(async () => ({
  default: (await import('./components/embassy-relations')).EmbassyRelations,
}));

const TownHallCelebrations = lazy(async () => ({
  default: (await import('./components/town-hall-celebrations'))
    .TownHallCelebrations,
}));

const MarketplaceBuy = lazy(async () => ({
  default: (await import('./components/marketplace-trade')).MarketplaceTrade,
}));

const MarketplaceTradeRoutes = lazy(async () => ({
  default: (await import('./components/marketplace-trade-routes'))
    .MarketplaceTradeRoutes,
}));

const AcademyUnitResearch = lazy(async () => ({
  default: (await import('./components/academy-unit-research'))
    .AcademyUnitResearch,
}));

const SmithyUnitImprovement = lazy(async () => ({
  default: (await import('./components/smithy-unit-improvement'))
    .SmithyUnitImprovement,
}));

const HerosMansionOasis = lazy(async () => ({
  default: (await import('./components/heros-mansion-oasis')).HerosMansionOasis,
}));

const BreweryCelebration = lazy(async () => ({
  default: (await import('./components/brewery-celebrations'))
    .BreweryCelebration,
}));

const BarracksTroopTraining = lazy(async () => ({
  default: (await import('./components/barracks-troop-training'))
    .BarracksTroopTraining,
}));

const GreatBarracksTroopTraining = lazy(async () => ({
  default: (await import('./components/great-barracks-troop-training'))
    .GreatBarracksTroopTraining,
}));

const StableTroopTraining = lazy(async () => ({
  default: (await import('./components/stable-troop-training'))
    .StableTroopTraining,
}));

const GreatStableTroopTraining = lazy(async () => ({
  default: (await import('./components/great-stable-troop-training'))
    .GreatStableTroopTraining,
}));

const WorkshopTroopTraining = lazy(async () => ({
  default: (await import('./components/workshop-troop-training'))
    .WorkshopTroopTraining,
}));

const HospitalTroopTraining = lazy(async () => ({
  default: (await import('./components/hospital-troop-training'))
    .HospitalTroopTraining,
}));

const palaceTabs = new Map<string, LazyExoticComponent<() => JSX.Element>>([
  ['train-settlers', PalaceTrainSettler],
  ['loyalty', PalaceLoyalty],
  ['expansion', PalaceExpansion],
]);

const buildingDetailsTabMap = new Map<
  Building['id'],
  Map<string, LazyExoticComponent<() => JSX.Element>>
>([
  [
    'MAIN_BUILDING',
    new Map([['village-management', MainBuildingVillageManagement]]),
  ],
  [
    'RALLY_POINT',
    new Map([
      ['troop-movements', RallyPointTroopMovements],
      ['send-troops', RallyPointSendTroops],
      ['simulator', RallyPointSimulator],
    ]),
  ],
  ['TREASURY', new Map([['artifacts', TreasuryArtifacts]])],
  ['EMBASSY', new Map([['artifacts', EmbassyRelations]])],
  ['TOWN_HALL', new Map([['artifacts', TownHallCelebrations]])],
  [
    'MARKETPLACE',
    new Map([
      ['trade', MarketplaceBuy],
      ['trade-routes', MarketplaceTradeRoutes],
    ]),
  ],
  ['ACADEMY', new Map([['unit-research', AcademyUnitResearch]])],
  ['SMITHY', new Map([['unit-improvement', SmithyUnitImprovement]])],
  ['RESIDENCE', palaceTabs],
  ['COMMAND_CENTER', palaceTabs],
  ['HEROS_MANSION', new Map([['oasis', HerosMansionOasis]])],
  ['BREWERY', new Map([['celebration', BreweryCelebration]])],
  ['BARRACKS', new Map([['train', BarracksTroopTraining]])],
  ['GREAT_BARRACKS', new Map([['train', GreatBarracksTroopTraining]])],
  ['STABLE', new Map([['train', StableTroopTraining]])],
  ['GREAT_STABLE', new Map([['train', GreatStableTroopTraining]])],
  ['WORKSHOP', new Map([['train', WorkshopTroopTraining]])],
  ['HOSPITAL', new Map([['train', HospitalTroopTraining]])],
]);

// t('train-settlers')
// t('loyalty')
// t('expansion')
// t('village-management')
// t('troop-movements')
// t('send-troops')
// t('simulator')
// t('artifacts')
// t('trade')
// t('trade-routes')
// t('unit-research')
// t('unit-improvement')
// t('oasis')
// t('celebration')
// t('celebrations')
// t('relations')
// t('train')

export const BuildingDetails = () => {
  const { t, t: assetsT, t: dynamicT } = useTranslation();
  const { buildingField, buildingFieldId } = use(BuildingFieldContext);

  const buildingId = buildingField!.buildingId;

  const { actualLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId!);

  const tabs = Array.from([
    'default',
    ...(buildingDetailsTabMap.get(buildingId)?.keys() ?? []).filter(
      (tabName) => tabName !== 'default',
    ),
    'upgrade-cost',
  ]);

  const buildingSpecificTabs = tabs.filter(
    (tab: string) => !['default', 'upgrade-cost'].includes(tab),
  );

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const backlinkTarget = buildingFieldId > 18 ? '../village' : '../resources';

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={backlinkTarget}>
              {buildingFieldId > 18 ? t('Village') : t('Resources')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {assetsT(`BUILDINGS.${buildingId}.NAME`)}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">
        {assetsT(`BUILDINGS.${buildingId}.NAME`)} -{' '}
        {t('level {{level}}', { level: actualLevel })}
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
              <Tab key={name}>{dynamicT(name)}</Tab>
            ))}
            <Tab>{t('Upgrade details')}</Tab>
          </TabList>
          <TabPanel>
            <Section>
              <SectionContent>
                <Bookmark tab="default" />
                <Text as="h2">
                  {t('{{buildingName}} overview', {
                    buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`),
                  })}
                </Text>
                <BuildingCard buildingId={buildingId}>
                  <BuildingOverview />
                  <BuildingUnfinishedNotice />
                  <BuildingBenefits />
                  <BuildingCost />
                  <BuildingActions />
                </BuildingCard>
              </SectionContent>
            </Section>
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
