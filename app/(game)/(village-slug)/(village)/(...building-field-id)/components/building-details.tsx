import { BuildingActions } from 'app/(game)/(village-slug)/(village)/components/building-actions';
import { BuildingOverview } from 'app/(game)/(village-slug)/(village)/components/building-overview';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  getBuildingData,
  getBuildingFieldByBuildingFieldId,
} from 'app/(game)/(village-slug)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
import { Text } from 'app/components/text';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { Icon } from 'app/components/icon';
import { formatNumber } from 'app/utils/common';
import { formatTime } from 'app/utils/time';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

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

const palaceTabs = new Map<string, React.LazyExoticComponent<() => React.JSX.Element>>([
  ['default', PalaceTrainSettler],
  [t('Loyalty'), PalaceLoyalty],
  [t('Expansion'), PalaceExpansion],
]);

const buildingDetailsTabMap = new Map<Building['id'], Map<string, React.LazyExoticComponent<() => React.JSX.Element>>>([
  [
    'RALLY_POINT',
    new Map([
      ['default', RallyPointIncomingTroops],
      [t('Send troops'), RallyPointSendTroops],
      [t('Simulator'), RallyPointSimulator],
    ]),
  ],
  ['TREASURY', new Map([['default', TreasuryArtifacts]])],
  [
    'MARKETPLACE',
    new Map([
      ['default', MarketplaceBuy],
      [t('Trade routes'), MarketplaceTradeRoutes],
    ]),
  ],
  [
    'ACADEMY',
    new Map([
      ['default', AcademyUnitResearch],
      [t('Unit improvement'), AcademyUnitImprovement],
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

const BuildingStats = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { total: buildingDurationModifier, serverEffectValue } = useComputedEffect('buildingDuration');
  const { buildingId, level } = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!)!;
  const building = getBuildingData(buildingId);

  const mainBuildingLevel = currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'MAIN_BUILDING')?.level ?? 0;

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Upgrade cost')}</Text>
        <div className="overflow-x-scroll scrollbar-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Level')}</TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="wood"
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="clay"
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="iron"
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="wheat"
                  />
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(building.maxLevel)].map((_, index) => {
                const cost = calculateBuildingCostForLevel(building.id, index + 1);

                return (
                  <TableRow
                    // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                    key={index}
                    {...(index + 1 === level && {
                      className: 'bg-gray-100',
                    })}
                  >
                    <TableHeaderCell>{index + 1}</TableHeaderCell>
                    <TableCell>{formatNumber(cost[0])}</TableCell>
                    <TableCell>{formatNumber(cost[1])}</TableCell>
                    <TableCell>{formatNumber(cost[2])}</TableCell>
                    <TableCell>{formatNumber(cost[3])}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Upgrade duration')}</Text>
        <div className="overflow-x-scroll scrollbar-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell rowSpan={2}>{t('Level')}</TableHeaderCell>
                <TableHeaderCell colSpan={3}>{t('Upgrade duration')}</TableHeaderCell>
              </TableRow>
              <TableRow>
                <TableHeaderCell>{t('Main building level {{level}}', { level: 1 })}</TableHeaderCell>
                <TableHeaderCell>{t('Main building level {{level}}', { level: mainBuildingLevel })}</TableHeaderCell>
                <TableHeaderCell>{t('Main building level {{level}}', { level: 20 })}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(building.maxLevel)].map((_, index) => {
                const duration = calculateBuildingDurationForLevel(buildingId, index + 1);

                return (
                  <TableRow
                    // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                    key={index}
                    {...(index + 1 === level && {
                      className: 'bg-gray-100',
                    })}
                  >
                    <TableHeaderCell>{index + 1}</TableHeaderCell>
                    <TableCell>{formatTime(duration * serverEffectValue)}</TableCell>
                    <TableCell>{formatTime(duration * buildingDurationModifier)}</TableCell>
                    <TableCell>{formatTime(duration * serverEffectValue * 0.5)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </article>
  );
};

export const BuildingDetails = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { buildingId } = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!)!;
  const { villagePath, resourcesPath } = useGameNavigation();
  const { actualLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId!);

  const parentLink = buildingFieldId! > 18 ? villagePath : resourcesPath;

  const hasAdditionalContent = buildingDetailsTabMap.has(buildingId);
  const MainTabAdditionalContent = hasAdditionalContent ? buildingDetailsTabMap.get(buildingId)!.get('default')! : null;

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
            <article className="flex flex-col gap-2">
              <Text as="h2">{t('{{buildingName}} overview', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`) })}</Text>
              <BuildingOverview buildingId={buildingId} />
              <BuildingActions buildingId={buildingId} />
              <Suspense fallback={<>Loading tab</>}>
                {!MainTabAdditionalContent ? null : (
                  <div className="mt-2">
                    <MainTabAdditionalContent />
                  </div>
                )}
              </Suspense>
            </article>
          </TabPanel>
          {buildingSpecificTabs.map((name: string) => {
            const Panel = buildingDetailsTabMap.get(buildingId)!.get(name)!;
            return (
              <TabPanel key={name}>
                <Suspense fallback={<>Loading tab</>}>
                  <Panel />
                </Suspense>
              </TabPanel>
            );
          })}
          <TabPanel>
            <BuildingStats />
          </TabPanel>
        </Tabs>
      </div>
    </>
  );
};
