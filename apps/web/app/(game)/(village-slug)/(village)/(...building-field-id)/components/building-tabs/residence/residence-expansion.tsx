import { useTranslation } from 'react-i18next';
import { calculateCulturePointsRequirementForVillageCount } from '@pillage-first/game-assets/utils/culture-points';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { useCulturePointsProgress } from 'app/(game)/(village-slug)/hooks/use-culture-points-progress';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Progress } from 'app/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['culture-points', 'culture-point-requirements'];
const minimumRequirementRows = 20;

const CulturePoints = () => {
  const { t } = useTranslation();
  const {
    culturePoints,
    dailyProduction,
    availableCulturePoints,
    availableVillageCount,
    nextRequirement,
    nextRequirementAt,
    progress,
  } = useCulturePointsProgress();

  return (
    <SectionContent>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <Icon
              type="culturePoints"
              className="size-5"
            />
            <span>
              {t('Culture points')}{' '}
              {formatNumber(Math.floor(availableCulturePoints))} /{' '}
              {formatNumber(nextRequirement)}
            </span>
          </span>
          <span className="text-sm tabular-nums">
            {t('{{percent}}% filled', { percent: progress.toFixed(1) })}
          </span>
        </div>
        <div className="relative">
          <Progress
            value={progress}
            aria-label={t('Culture points progress')}
            aria-valuetext={`${formatNumber(Math.floor(availableCulturePoints))} / ${formatNumber(nextRequirement)}`}
            className="box-content h-2.5 rounded-xs border border-[#b8b2a9] bg-[linear-gradient(#7b746e,#dad8d5,#ebebeb)] shadow-inner [&_[data-slot=progress-indicator]]:bg-[linear-gradient(#b1e4ff,#24b4fd_60%,#1271a2)]"
          />
          {nextRequirementAt !== null && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap text-[8px] lg:text-xs leading-none font-medium tabular-nums text-black">
              <Countdown
                endsAt={nextRequirementAt}
                aria-label={t('Time remaining')}
              />
            </span>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            {t('Villages')}
          </dt>
          <dd className="font-medium tabular-nums">
            {formatNumber(culturePoints.villageCount)} /{' '}
            {formatNumber(availableVillageCount)}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            {t('Current culture points')}
          </dt>
          <dd className="font-medium tabular-nums">
            {formatNumber(Math.floor(availableCulturePoints))}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            {t('Remaining to unlock')}
          </dt>
          <dd className="font-medium tabular-nums">
            {formatNumber(
              Math.max(0, Math.ceil(nextRequirement - availableCulturePoints)),
            )}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            {t('Village production')}
          </dt>
          <dd className="font-medium tabular-nums">
            {t('{{amount}} per day', {
              amount: formatNumber(
                culturePoints.currentVillageCulturePointsProduction,
              ),
            })}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            {t('Global production')}
          </dt>
          <dd className="font-medium tabular-nums">
            {t('{{amount}} per day', {
              amount: formatNumber(dailyProduction),
            })}
          </dd>
        </div>
      </dl>
    </SectionContent>
  );
};

const CulturePointRequirements = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { culturePoints } = useCulturePoints();
  const { culturePointsRequirementSpeed } = server.configuration;
  const nextVillageCount = culturePoints.villageCount + 1;
  const villageCounts = Array.from(
    { length: Math.max(minimumRequirementRows, nextVillageCount) },
    (_, index) => index + 1,
  );

  return (
    <OverflowContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell scope="col">{t('Villages')}</TableHeaderCell>
            <TableHeaderCell scope="col">
              {t('Culture points required')}
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {villageCounts.map((villageCount) => {
            const isNextVillage = villageCount === nextVillageCount;

            return (
              <TableRow
                key={villageCount}
                className={
                  isNextVillage
                    ? 'bg-muted font-semibold hover:bg-muted'
                    : undefined
                }
              >
                <TableCell>
                  {isNextVillage && (
                    <span className="sr-only">{t('Next village')} </span>
                  )}
                  {formatNumber(villageCount)}
                </TableCell>
                <TableCell>
                  {formatNumber(
                    calculateCulturePointsRequirementForVillageCount(
                      villageCount,
                      culturePointsRequirementSpeed,
                    ),
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </OverflowContainer>
  );
};

export const ResidenceExpansion = () => {
  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(tabs, 'expansion-tab');

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="expansion" />
        <InformationPopover ariaLabel={t('Expansion')}>
          <Text>
            {t(
              'Track your culture point production and see how many points you need to unlock more villages.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Expansion')}</Text>
      </SectionContent>
      <SectionContent>
        <Tabs
          value={tabs[tabIndex] ?? tabs[0]}
          onValueChange={navigateToTab}
        >
          <TabList aria-label={t('Expansion')}>
            <Tab value="culture-points">{t('Culture points')}</Tab>
            <Tab value="culture-point-requirements">
              {t('Culture point requirements')}
            </Tab>
          </TabList>
          <TabPanel value="culture-points">
            <CulturePoints />
          </TabPanel>
          <TabPanel value="culture-point-requirements">
            <CulturePointRequirements />
          </TabPanel>
        </Tabs>
      </SectionContent>
    </Section>
  );
};
