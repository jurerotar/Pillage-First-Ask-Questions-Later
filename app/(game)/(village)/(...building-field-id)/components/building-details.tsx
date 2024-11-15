import { BuildingActions } from 'app/(game)/(village)/components/building-actions';
import { BuildingOverview } from 'app/(game)/(village)/components/building-overview';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { getBuildingData, getBuildingFieldByBuildingFieldId } from 'app/(game)/utils/building';
import { StyledTab } from 'app/components/styled-tab';
import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { Text } from 'app/components/text';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/tables/table';
import { Icon } from 'app/components/icon';
import { formatNumber } from 'app/utils/common';
import { formatTime } from 'app/utils/time';

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
  default: (await import('./components/palace-settler-training')).PalaceSettlerTraining,
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

const BuildingStats: React.FC = () => {
  const { t: buildingStatsT } = useTranslation('translation', {
    keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.BUILDING_STATS',
  });

  const { currentVillage, mainBuildingLevel } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { total: buildingDurationModifier, serverEffectValue } = useComputedEffect('buildingDuration');
  const { buildingId, level } = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!)!;
  const building = getBuildingData(buildingId);

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h2">{buildingStatsT('UPGRADE_COST')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{buildingStatsT('LEVEL')}</TableHeaderCell>
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
            {building.buildingCost.map((cost, index) => (
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
            ))}
          </TableBody>
        </Table>
      </section>
      <section className="flex flex-col gap-2">
        <Text as="h2">{buildingStatsT('UPGRADE_DURATION')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell rowSpan={2}>{buildingStatsT('LEVEL')}</TableHeaderCell>
              <TableHeaderCell colSpan={3}>{buildingStatsT('UPGRADE_DURATION')}</TableHeaderCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell className="whitespace-nowrap">{buildingStatsT('MAIN_BUILDING_LEVEL', { level: 1 })}</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">
                {buildingStatsT('MAIN_BUILDING_LEVEL', { level: mainBuildingLevel })}
              </TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">{buildingStatsT('MAIN_BUILDING_LEVEL', { level: 20 })}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {building.buildingDuration.map((duration, index) => (
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
            ))}
          </TableBody>
        </Table>
      </section>
    </article>
  );
};

export const BuildingDetails: React.FC = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TABS' });
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
    <article className="flex flex-col gap-2">
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => setTabIndex(index)}
      >
        <TabList className="flex mb-2 overflow-x-scroll scrollbar-hidden">
          <StyledTab>{t('DEFAULT')}</StyledTab>
          {tabs.map((name: string) => (
            <StyledTab key={name}>{t(`${buildingId}.${name}`)}</StyledTab>
          ))}
          <StyledTab>{t('UPGRADE_STATS')}</StyledTab>
        </TabList>
        <TabPanel>
          <div className="border border-gray-500 p-2">
            <BuildingOverview
              buildingId={buildingId}
              showLevel
            />
            <BuildingActions buildingId={buildingId} />
          </div>
          <Suspense fallback={<>Loading tab</>}>
            {!MainTabAdditionalContent ? null : (
              <div className="mt-2 border border-gray-500 p-2">
                <MainTabAdditionalContent />
              </div>
            )}
          </Suspense>
        </TabPanel>
        {tabs.map((name: string) => {
          const Panel = buildingDetailsTabMap.get(buildingId)!.get(name)!;
          return (
            <TabPanel key={name}>
              <Suspense fallback={<>Loading tab</>}>
                <div className="border border-gray-500 p-2">
                  <Panel />
                </div>
              </Suspense>
            </TabPanel>
          );
        })}
        <TabPanel>
          <BuildingStats />
        </TabPanel>
      </Tabs>
    </article>
  );
};
