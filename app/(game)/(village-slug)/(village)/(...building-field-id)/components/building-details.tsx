import type { Building } from 'app/interfaces/models/game/building';
import { type JSX, type LazyExoticComponent, use, Suspense } from 'react';
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
import { lazyWithRetry } from 'app/utils/imports';

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

const BuildingStats = lazyWithRetry(async () => ({
  default: (await import('./components/building-stats/building-stats'))
    .BuildingStats,
}));

const MainBuildingVillageManagement = lazyWithRetry(async () => ({
  default: (
    await import('./components/main-building/main-building-village-management')
  ).MainBuildingVillageManagement,
}));

const RallyPointTroopMovements = lazyWithRetry(async () => ({
  default: (
    await import('./components/rally-point/rally-point-troop-movements')
  ).RallyPointTroopMovements,
}));

const RallyPointSendTroops = lazyWithRetry(async () => ({
  default: (await import('./components/rally-point/rally-point-send-troops'))
    .RallyPointSendTroops,
}));

const RallyPointSimulator = lazyWithRetry(async () => ({
  default: (await import('./components/rally-point/rally-point-simulator'))
    .RallyPointSimulator,
}));

const PalaceTrainSettler = lazyWithRetry(async () => ({
  default: (await import('./components/palace/palace-settler-training'))
    .PalaceSettlerTraining,
}));

const PalaceLoyalty = lazyWithRetry(async () => ({
  default: (await import('./components/palace/palace-loyalty')).PalaceLoyalty,
}));

const PalaceExpansion = lazyWithRetry(async () => ({
  default: (await import('./components/palace/palace-expansion'))
    .PalaceExpansion,
}));

const TreasuryArtifacts = lazyWithRetry(async () => ({
  default: (await import('./components/treasury/treasury-artifacts'))
    .TreasuryArtifacts,
}));

const EmbassyRelations = lazyWithRetry(async () => ({
  default: (await import('./components/embassy/embassy-relations'))
    .EmbassyRelations,
}));

const TownHallCelebrations = lazyWithRetry(async () => ({
  default: (await import('./components/town-hall/town-hall-celebrations'))
    .TownHallCelebrations,
}));

const MarketplaceBuy = lazyWithRetry(async () => ({
  default: (await import('./components/marketplace/marketplace-trade'))
    .MarketplaceTrade,
}));

const MarketplaceTradeRoutes = lazyWithRetry(async () => ({
  default: (await import('./components/marketplace/marketplace-trade-routes'))
    .MarketplaceTradeRoutes,
}));

const AcademyUnitResearch = lazyWithRetry(async () => ({
  default: (await import('./components/academy/academy-unit-research'))
    .AcademyUnitResearch,
}));

const SmithyUnitImprovement = lazyWithRetry(async () => ({
  default: (await import('./components/smithy/smithy-unit-improvement'))
    .SmithyUnitImprovement,
}));

const HerosMansionOasis = lazyWithRetry(async () => ({
  default: (await import('./components/heros-mansion/heros-mansion-oasis'))
    .HerosMansionOasis,
}));

const BreweryCelebration = lazyWithRetry(async () => ({
  default: (await import('./components/brewery/brewery-celebrations'))
    .BreweryCelebration,
}));

const BarracksTroopTraining = lazyWithRetry(async () => ({
  default: (
    await import(
      './components/unit-production-buildings/barracks-troop-training'
    )
  ).BarracksTroopTraining,
}));

const GreatBarracksTroopTraining = lazyWithRetry(async () => ({
  default: (
    await import(
      './components/unit-production-buildings/great-barracks-troop-training'
    )
  ).GreatBarracksTroopTraining,
}));

const StableTroopTraining = lazyWithRetry(async () => ({
  default: (
    await import('./components/unit-production-buildings/stable-troop-training')
  ).StableTroopTraining,
}));

const GreatStableTroopTraining = lazyWithRetry(async () => ({
  default: (
    await import(
      './components/unit-production-buildings/great-stable-troop-training'
    )
  ).GreatStableTroopTraining,
}));

const WorkshopTroopTraining = lazyWithRetry(async () => ({
  default: (
    await import(
      './components/unit-production-buildings/workshop-troop-training'
    )
  ).WorkshopTroopTraining,
}));

const HospitalTroopTraining = lazyWithRetry(async () => ({
  default: (
    await import(
      './components/unit-production-buildings/hospital-troop-training'
    )
  ).HospitalTroopTraining,
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
  ['TOWN_HALL', new Map([['celebrations', TownHallCelebrations]])],
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
  const { t } = useTranslation();
  const { buildingField, buildingFieldId } = use(BuildingFieldContext);

  const { buildingId } = buildingField!;

  const { actualLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId);

  const tabs = [
    'default',
    ...(buildingDetailsTabMap.get(buildingId)?.keys() ?? []).filter(
      (tabName) => tabName !== 'default',
    ),
    'upgrade-cost',
  ];

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
          <BreadcrumbItem>{t(`BUILDINGS.${buildingId}.NAME`)}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">
        {t(`BUILDINGS.${buildingId}.NAME`)} -{' '}
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
              <Tab key={name}>{t(name)}</Tab>
            ))}
            <Tab>{t('Upgrade details')}</Tab>
          </TabList>
          <TabPanel>
            <Section>
              <SectionContent>
                <Bookmark tab="default" />
                <Text as="h2">
                  {t('{{buildingName}} overview', {
                    buildingName: t(`BUILDINGS.${buildingId}.NAME`),
                  })}
                </Text>
                <BuildingCard buildingId={buildingId}>
                  <BuildingOverview shouldShowTitle={false} />
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
