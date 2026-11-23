import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSortAlphaDown } from 'react-icons/fa';
import { Link, useLocation } from 'react-router';
import {
  type GameWorldFilterSelection,
  GameWorldFilters,
} from 'app/(public)/(game-worlds)/(index)/components/game-world-filters';
import { ServerCard } from 'app/(public)/(game-worlds)/(index)/components/server-card';
import { useGameWorldListing } from 'app/(public)/(game-worlds)/hooks/use-game-world-listing';
import type { GameWorldListingEntry } from 'app/(public)/(game-worlds)/utils/game-world-listing';
import { PageMetadata } from 'app/(public)/components/page-metadata';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Button } from 'app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';

type SortOrder = 'lastOpenedDesc' | 'lastOpenedAsc' | 'name';

const compareWorlds = (
  first: GameWorldListingEntry,
  second: GameWorldListingEntry,
  sortOrder: SortOrder,
) => {
  if (sortOrder !== 'name' && first.lastOpenedAt !== second.lastOpenedAt) {
    if (first.lastOpenedAt === undefined) {
      return 1;
    }
    if (second.lastOpenedAt === undefined) {
      return -1;
    }
    return sortOrder === 'lastOpenedAsc'
      ? first.lastOpenedAt - second.lastOpenedAt
      : second.lastOpenedAt - first.lastOpenedAt;
  }

  return first.name.localeCompare(second.name, undefined, {
    sensitivity: 'base',
  });
};

const matchesFilter = (selected: string[], value: string | number) =>
  selected.length === 0 || selected.includes(String(value));

const MyGameWorldsPage = () => {
  const { t } = useTranslation('public');
  const { pathname } = useLocation();
  const { gameWorldListing } = useGameWorldListing();
  const [sortOrder, setSortOrder] = useState<SortOrder>('lastOpenedDesc');
  const [filters, setFilters] = useState<GameWorldFilterSelection>({
    mapSize: [],
    speed: [],
    tribe: [],
  });

  const visibleWorlds = gameWorldListing
    .filter(
      (world) =>
        matchesFilter(filters.mapSize, world.configuration.mapSize) &&
        matchesFilter(filters.speed, world.configuration.speed) &&
        matchesFilter(filters.tribe, world.playerConfiguration.tribe),
    )
    .toSorted((first, second) => compareWorlds(first, second, sortOrder));

  const title = t('{{title}} | Pillage First!', { title: 'Game worlds' });

  return (
    <PageContents>
      <PageMetadata
        title={title}
        description="View, create, import, manage and continue playing your Pillage First! game worlds."
        pathname={pathname}
      />
      <div className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Game worlds')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text
            as="h1"
            className="text-3xl font-medium leading-tight lg:text-5xl"
          >
            {t('Your game worlds')}
          </Text>
          <Text>
            Your current game worlds are listed below. To prevent data
            corruptions, each game world may only be opened in a single browser
            window or tab simultaneously.
          </Text>

          {gameWorldListing.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select<SortOrder>
                value={sortOrder}
                onValueChange={setSortOrder}
              >
                <SelectTrigger
                  aria-label="Sort by"
                  size="sm"
                >
                  <FaSortAlphaDown aria-hidden="true" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastOpenedDesc">Last opened ↓</SelectItem>
                  <SelectItem value="lastOpenedAsc">Last opened ↑</SelectItem>
                  <SelectItem value="name">A–Z</SelectItem>
                </SelectContent>
              </Select>
              <GameWorldFilters
                filters={filters}
                onChange={setFilters}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {visibleWorlds.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
              />
            ))}
            {gameWorldListing.length > 0 && visibleWorlds.length === 0 && (
              <Alert variant="info">No game worlds match your filters.</Alert>
            )}
            {gameWorldListing.length === 0 && (
              <Alert variant="info">
                You don't have any existing game worlds. You may create your
                first one by clicking on the link above.
              </Alert>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Text>Want to create or import an existing game state?</Text>
            <div className="flex gap-2 overflow-x-scroll scrollbar-hidden">
              <Link to="/game-worlds/create">
                <Button>Create a new game world</Button>
              </Link>
              <Link to="/game-worlds/import">
                <Button variant="outline">Import existing game state</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </PageContents>
  );
};

export default MyGameWorldsPage;
