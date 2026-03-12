import { useTranslation } from 'react-i18next';
import { FaBookBookmark } from 'react-icons/fa6';
import { LuAnvil, LuConstruction } from 'react-icons/lu';
import { TbTargetArrow } from 'react-icons/tb';
import { useSearchParams } from 'react-router';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(hero)/+types/page.ts';
import { EventFilters } from 'app/(game)/(village-slug)/(events)/components/event-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import {
  type HistoryEvent,
  useEventsHistory,
} from 'app/(game)/(village-slug)/hooks/use-events-history';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
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
  }
};

type EventsListProps = {
  scope: 'village' | 'global';
  page: number;
  eventFilters: HistoryEvent['type'][];
  setSearchParams: (
    nextSearchParams:
      | URLSearchParams
      | ((prev: URLSearchParams) => URLSearchParams),
  ) => void;
};

const EventsList = ({
  scope,
  page,
  eventFilters,
  setSearchParams,
}: EventsListProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { events } = useEventsHistory(scope, eventFilters);
  const pagination = usePagination(events, 20, page);

  const handlePageChange = (newPage: number | ((prev: number) => number)) => {
    setSearchParams((prev) => {
      const nextP = typeof newPage === 'function' ? newPage(page) : newPage;
      prev.set('page', nextP.toString());
      return prev;
    });
  };

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
                <TableCell>{formatEventData(event)}</TableCell>
                <TableCell>
                  {new Date(event.timestamp * 1000).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8"
                >
                  {t(
                    'No events found yet. Upgrade a building or train, research or improve a unit first.',
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
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const eventFilters = (searchParams.getAll('types') ??
    []) as HistoryEvent['type'][];

  const handleFilterChange = (newFilters: HistoryEvent['type'][]) => {
    setSearchParams((prev) => {
      prev.delete('types');
      for (const filter of newFilters) {
        prev.append('types', filter);
      }
      prev.set('page', '1');
      return prev;
    });
  };

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
            onChange={handleFilterChange}
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
                    setSearchParams={setSearchParams}
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
                    setSearchParams={setSearchParams}
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
