import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBookBookmark } from 'react-icons/fa6';
import { LuAnvil, LuConstruction, LuFlag } from 'react-icons/lu';
import { TbTargetArrow } from 'react-icons/tb';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(hero)/+types/page';
import { EventFilters } from 'app/(game)/(village-slug)/(events)/components/event-filters';
import { useEventFilters } from 'app/(game)/(village-slug)/(events)/hooks/use-event-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import {
  type HistoryEvent,
  useEventsHistory,
} from 'app/(game)/(village-slug)/hooks/use-events-history';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Pagination } from 'app/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

type EventsListTableIconProps = {
  type: HistoryEvent['type'];
};

const EventsListTableIcon = ({ type }: EventsListTableIconProps) => {
  switch (type) {
    case 'construction': {
      return <LuConstruction />;
    }
    case 'research': {
      return <FaBookBookmark />;
    }
    case 'improvement': {
      return <LuAnvil />;
    }
    case 'training': {
      return <TbTargetArrow />;
    }
    case 'founding': {
      return <LuFlag />;
    }
  }
};

type EventsListProps = {
  scope: 'village' | 'global';
  page: number;
  eventFilters: HistoryEvent['type'][];
  handlePageChange: (newPage: number | ((prev: number) => number)) => void;
};

const EventsList = ({
  scope,
  page,
  eventFilters,
  handlePageChange,
}: EventsListProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { events } = useEventsHistory(scope, eventFilters);
  const pagination = usePagination(events, 20, page);

  const villageMap = useMemo(() => {
    return new Map(playerVillages.map((v) => [v.id, v.name]));
  }, [playerVillages]);

  const formatEventData = (event: HistoryEvent) => {
    const { type, data } = event;

    switch (type) {
      case 'construction':
        return t('{{building}} from level {{previousLevel}} to {{newLevel}}', {
          building: t(`BUILDINGS.${data.building}.NAME`),
          previousLevel: data.previousLevel,
          newLevel: data.newLevel,
        });
      case 'training':
        return t('Trained {{amount}} {{unit}}', {
          amount: data.amount,
          unit: t(`UNITS.${data.unit}.NAME`),
        });
      case 'improvement':
        return t(
          '{{unit}} improved from level {{previousLevel}} to {{newLevel}}',
          {
            unit: t(`UNITS.${data.unit}.NAME`),
            previousLevel: data.previousLevel,
            newLevel: data.newLevel,
          },
        );
      case 'research':
        return t('Researched {{unit}}', {
          unit: t(`UNITS.${data.unit}.NAME`),
        });
      case 'founding':
        return t('Village founded at ({{x}}, {{y}})', { x: data.x, y: data.y });
      default:
        return JSON.stringify(data);
    }
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">
          {scope === 'village'
            ? t('Latest events in {{villageName}}', {
                villageName: currentVillage.name,
              })
            : t('Latest events in your kingdom')}
        </Text>
        <Text>
          {scope === 'village'
            ? t(
                'This is a categorized view of latest building construction, unit research and unit improvement events in village "{{villageName}}". You may toggle different types through filters above.',
                { villageName: currentVillage.name },
              )
            : t(
                'This is a categorized view of all latest building construction, unit research and unit improvement events. You may toggle different types through filters above.',
              )}
        </Text>
      </SectionContent>
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Type')}</TableHeaderCell>
              {scope === 'global' && (
                <TableHeaderCell>{t('Village')}</TableHeaderCell>
              )}
              <TableHeaderCell>{t('Details')}</TableHeaderCell>
              <TableHeaderCell>{t('Date')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.currentPageItems.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <span className="inline-flex justify-center">
                    <EventsListTableIcon type={event.type} />
                  </span>
                </TableCell>
                {scope === 'global' && (
                  <TableCell>
                    {villageMap.get(event.villageId) ?? t('Unknown')}
                  </TableCell>
                )}
                <TableCell>{formatEventData(event)}</TableCell>
                <TableCell>
                  {new Date(event.timestamp * 1000).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={scope === 'global' ? 4 : 3}
                  className="text-center py-8"
                >
                  {t(
                    'No events found yet. Upgrade a building or train, research, improve a unit or found a village first.',
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full justify-end">
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};

const tabs = ['village', 'global'];

const EventsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(tabs);
  const {
    filters: eventFilters,
    onFiltersChange: onEventFiltersChange,
    page,
    handlePageChange,
  } = useEventFilters();

  const title = `${t('Event log')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Event log')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Section>
        <SectionContent>
          <Text as="h1">{t('Event log')}</Text>
          <EventFilters
            eventFilters={eventFilters}
            onChange={onEventFiltersChange}
          />
        </SectionContent>
        <SectionContent>
          <Tabs
            value={tabs[tabIndex]}
            onValueChange={(value) => navigateToTab(value)}
          >
            <TabList>
              <Tab value="village">{t('Current village')}</Tab>
              <Tab value="global">{t('All villages')}</Tab>
            </TabList>
            <TabPanel value="village">
              <Section>
                <SectionContent>
                  <EventsList
                    scope="village"
                    page={page}
                    eventFilters={eventFilters}
                    handlePageChange={handlePageChange}
                  />
                </SectionContent>
              </Section>
            </TabPanel>
            <TabPanel value="global">
              <Section>
                <SectionContent>
                  <EventsList
                    scope="global"
                    page={page}
                    eventFilters={eventFilters}
                    handlePageChange={handlePageChange}
                  />
                </SectionContent>
              </Section>
            </TabPanel>
          </Tabs>
        </SectionContent>
      </Section>
    </>
  );
};

export default EventsPage;
