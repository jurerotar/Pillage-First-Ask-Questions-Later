import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { CurrentVillageStateProvider } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import type { Resource } from 'app/interfaces/models/game/resource';
import clsx from 'clsx';
import type React from 'react';
import { Suspense } from 'react';
import { Fragment, memo, useEffect, useRef } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useCenterHorizontally } from 'app/(game)/(village-slug)/hooks/dom/use-center-horizontally';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useAdventurePoints } from 'app/(game)/(village-slug)/hooks/use-adventure-points';
import { ResourceCounter } from 'app/(game)/(village-slug)/components/resource-counter';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { calculateHeroLevel } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { usePlayerTroops } from 'app/(game)/(village-slug)/hooks/use-player-troops';
import { ConstructionQueue } from 'app/(game)/(village-slug)/components/construction-queue';
import { TroopMovements } from 'app/(game)/(village-slug)/components/troop-movements';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { useTranslation } from 'react-i18next';
import { TroopList } from 'app/(game)/(village-slug)/components/troop-list';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import layoutStyles from './layout.module.scss';
import { useActiveRoute } from 'app/(game)/(village-slug)/hooks/routes/use-active-route';
import { parseCoordinatesFromTileId } from 'app/utils/map';
import { Tooltip } from 'app/components/tooltip';
import { Spinner } from 'app/components/ui/spinner';
import { CurrentVillageBuildingQueueContextProvider } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { useTextDirection } from 'app/hooks/use-text-direction';

type CounterProps = {
  counter?: number;
};

const Counter: React.FC<CounterProps> = ({ counter }) => {
  if (!counter) {
    return null;
  }

  return (
    <span className="absolute size-5 lg:size-6 text-sm font-medium bg-background z-10 -top-2 lg:top-0 -right-2 lg:-right-3 rounded-full border lg:border-2 border-border shadow-md inline-flex justify-center items-center">
      {counter > 99 ? '99' : counter}
    </span>
  );
};

const ReportsCounter = () => {
  const { reports } = useReports();
  return <Counter counter={reports.length} />;
};

const AdventurePointsCounter = () => {
  const { adventurePoints } = useAdventurePoints();
  return <Counter counter={adventurePoints.amount} />;
};

const QuestsCounter = () => {
  const { collectableQuestCount } = useQuests();
  return <Counter counter={collectableQuestCount} />;
};

type NavigationSideItemProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const NavigationSideItem: React.FCWithChildren<NavigationSideItemProps> = memo(
  ({ children, ...rest }) => {
    return (
      <button
        type="button"
        className="
          flex items-center justify-center shadow-md rounded-md px-3 py-2 border border-border relative
          bg-gradient-to-t from-[#f2f2f2] to-[#ffffff]
          transition-transform active:scale-95 active:shadow-inner
          lg:size-12 lg:p-0 lg:rounded-full lg:shadow lg:border-0 lg:bg-gradient-to-t lg:from-[#a3a3a3] lg:to-[#c8c8c8]
        "
        {...rest}
      >
        <span className="lg:size-10 lg:bg-background lg:rounded-full flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  },
);

const DiscordLink = () => {
  return (
    <a
      href="https://discord.com/invite/Ep7NKVXUZA"
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-border relative bg-background"
      title="Discord"
      rel="noopener"
    >
      <span className="flex items-center justify-center">
        <i className="icon icon-[fa-discord] text-2xl text-[#7289da]" />
      </span>
    </a>
  );
};

const HeroNavigationItem = () => {
  const { t } = useTranslation();
  const { hero, health, experience } = useHero();
  const { heroPath } = useGameNavigation();
  const { playerTroops } = usePlayerTroops();

  const isHeroHome = !!playerTroops.find(({ unitId }) => unitId === 'HERO');

  const { level, percentToNextLevel } = calculateHeroLevel(experience);

  // Each level gets you 4 selectable attributes to pick. Show icon if user has currently selected less than total possible.
  const isLevelUpAvailable =
    (level + 1) * 4 >
    Object.values(hero?.selectableAttributes ?? 0).reduce(
      (total, curr) => total + curr,
      0,
    );

  return (
    <Link
      to={heroPath}
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-border relative bg-gradient-to-t from-[#f2f2f2] to-[#ffffff]"
      aria-label={t('Hero')}
      title={t('Hero')}
    >
      <span className="lg:size-10 flex items-center justify-center">
        <i className="icon icon-[md-face] text-2xl" />
      </span>
      {isLevelUpAvailable && (
        <span className="absolute text-center size-4 bg-background top-0 -right-1.5 rounded-full border border-border shadow-md">
          <i className="icon icon-[hi-star] text-yellow-300 text-sm" />
        </span>
      )}
      <span className="absolute size-4 bg-background bottom-0 -right-1.5 rounded-full border border-border shadow-md inline-flex justify-center items-center">
        {isHeroHome && (
          <i className="icon icon-[fa-home] text-gray-500 text-xs" />
        )}
        {!isHeroHome && (
          <i className="icon icon-[tb-shoe] text-gray-500 text-xs" />
        )}
      </span>
      <span className="inline-flex items-center justify-center absolute top-0 right-8 h-4 w-9 rounded-full border border-border shadow-md">
        <span className="relative inline-flex size-full bg-gray-100 rounded-full overflow-hidden">
          <span
            className={clsx(
              'absolute top-0 left-0 w-full h-full origin-left transition-transform',
              health === 100 ? 'rounded-full' : 'rounded-l-full',
              health > 50
                ? 'bg-green-500'
                : health > 20
                  ? 'bg-orange-500'
                  : 'bg-red-500',
            )}
            style={{
              transform: `scaleX(${health / 100})`,
            }}
          />
        </span>
        <span className="absolute absolute-centering text-2xs text-white text-shadow-lg">
          {health}%
        </span>
      </span>
      <span className="inline-flex items-center justify-center absolute bottom-0 right-8 h-4 w-9 rounded-full border border-border shadow-md">
        <span className="relative inline-flex size-full bg-gray-100 rounded-full overflow-hidden">
          <span
            className={clsx(
              'absolute top-0 left-0 w-full h-full bg-blue-500 origin-left transition-transform',
              percentToNextLevel === 100 ? 'rounded-full' : 'rounded-l-full',
            )}
            style={{
              transform: `scaleX(${percentToNextLevel / 100})`,
            }}
          />
        </span>
        <span className="absolute absolute-centering text-2xs text-white text-shadow-lg">
          {percentToNextLevel}%
        </span>
      </span>
    </Link>
  );
};

const DesktopTopRowItem: React.FCWithChildren<
  React.ComponentProps<'button'>
> = ({ children, ...rest }) => {
  return (
    <button
      type="button"
      className="
        px-3 py-0.5 rounded-xs bg-gradient-to-t bg-card
        flex items-center justify-center
        transition-transform active:scale-95 active:shadow-inner
      "
      {...rest}
    >
      {children}
    </button>
  );
};

type NavigationMainItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive: boolean;
  className?: string;
};

const NavigationMainItem: React.FCWithChildren<NavigationMainItemProps> = ({
  children,
  ...rest
}) => {
  const { isActive, ...htmlProps } = rest;

  return (
    <button
      type="button"
      className={clsx(
        isActive
          ? 'from-[#7da100] to-[#c7e94f]'
          : 'from-[#b8b2a9] to-[#f1f0ee]',
        'bg-gradient-to-t size-14 lg:size-18 rounded-full flex items-center justify-center shadow-lg lg:shadow-none',
        'transition-transform transform-gpu active:scale-95 lg:active:scale-100',
      )}
      {...htmlProps}
    >
      <span className="size-12 lg:size-15 bg-background rounded-full flex items-center justify-center">
        {children}
      </span>
    </button>
  );
};

const QuestsNavigationItem = () => {
  const { t } = useTranslation();
  const { questsPath } = useGameNavigation();

  return (
    <Link to={questsPath}>
      <NavigationSideItem
        aria-label={t('Quests')}
        title={t('Quests')}
      >
        <Suspense fallback={null}>
          <QuestsCounter />
        </Suspense>
        <i className="icon icon-[lu-book-marked] text-2xl" />
      </NavigationSideItem>
    </Link>
  );
};

const AdventuresNavigationItem = () => {
  const { t } = useTranslation();
  const { adventuresPath } = useGameNavigation();

  return (
    <Link to={adventuresPath}>
      <NavigationSideItem
        aria-label={t('Adventures')}
        title={t('Adventures')}
      >
        <Suspense fallback={null}>
          <AdventurePointsCounter />
        </Suspense>
        <i className="icon icon-[pi-path-bold] text-2xl" />
      </NavigationSideItem>
    </Link>
  );
};

const ReportsNavigationItem = () => {
  const { t } = useTranslation();
  const { reportsPath } = useGameNavigation();

  return (
    <Link to={reportsPath}>
      <NavigationSideItem
        aria-label={t('Reports')}
        title={t('Reports')}
      >
        <Suspense fallback={null}>
          <ReportsCounter />
        </Suspense>
        <i className="icon icon-[lu-scroll-text] text-2xl" />
      </NavigationSideItem>
    </Link>
  );
};

const ResourcesNavigationItem = () => {
  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();
  const { isResourcesPageOpen } = useActiveRoute();

  return (
    <Link
      to={resourcesPath}
      prefetch="render"
    >
      <NavigationMainItem
        aria-label={t('Resources')}
        title={t('Resources')}
        isActive={isResourcesPageOpen}
      >
        <i className="icon icon-[gi-wheat] text-3xl" />
      </NavigationMainItem>
    </Link>
  );
};

const VillageNavigationItem = () => {
  const { t } = useTranslation();
  const { villagePath } = useGameNavigation();
  const { isVillagePageOpen } = useActiveRoute();

  return (
    <Link
      to={villagePath}
      prefetch="render"
    >
      <NavigationMainItem
        aria-label={t('Village')}
        title={t('Village')}
        isActive={isVillagePageOpen}
      >
        <i className="icon icon-[md-outline-holiday-village] text-3xl" />
      </NavigationMainItem>
    </Link>
  );
};

const MapNavigationItem = () => {
  const { t } = useTranslation();
  const { mapPath } = useGameNavigation();
  const { isMapPageOpen } = useActiveRoute();

  return (
    <NavLink
      to={mapPath}
      prefetch="render"
    >
      <NavigationMainItem
        aria-label={t('Map')}
        title={t('Map')}
        isActive={isMapPageOpen}
      >
        <i className="icon icon-[tb-map-2] text-3xl" />
      </NavigationMainItem>
    </NavLink>
  );
};

const ResourceCounters = () => {
  return (
    <div className="flex w-full lg:border-none py-0.5 mx-auto gap-1 lg:gap-2">
      {(['wood', 'clay', 'iron', 'wheat'] as Resource[]).map(
        (resource: Resource, index) => (
          <Fragment key={resource}>
            <ResourceCounter resource={resource} />
            {index !== 3 && <span className="w-[2px] h-full bg-gray-300" />}
          </Fragment>
        ),
      )}
    </div>
  );
};

const VillageSelect = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getNewVillageUrl } = useGameNavigation();
  const { playerVillages } = usePlayerVillages();
  const { currentVillage } = useCurrentVillage();

  return (
    <Select
      onValueChange={(value) => navigate(getNewVillageUrl(value))}
      value={currentVillage.slug}
    >
      <SelectTrigger
        className="w-full"
        title={t('Village select')}
        aria-label={t('Village select')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {playerVillages.map(({ slug, name, id }) => {
          const { x, y } = parseCoordinatesFromTileId(id);
          const formattedId = `${x}|${y}`;
          return (
            <SelectItem
              key={id}
              value={slug}
            >
              {name} ({formattedId})
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});

const TopNavigation = () => {
  const { t } = useTranslation();
  const gameNavigation = useGameNavigation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  return (
    <header className="flex flex-col w-full p-2 pt-0 lg:p-0 relative bg-gradient-to-r from-gray-200 via-white to-gray-200">
      {isWiderThanLg && (
        <div className="flex-col hidden lg:flex shadow-sm bg-card">
          <div className="hidden lg:flex w-full bg-muted py-1 px-2">
            <nav className="hidden lg:flex justify-end container mx-auto">
              <ul className="flex gap-1">
                <li>
                  <Link
                    target="_blank"
                    to="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                  >
                    <DesktopTopRowItem>
                      <span className="inline-flex gap-2 items-center">
                        <i className="icon icon-[fa-github] text-xl text-[#24292e]" />
                        <span className="text-sm font-semibold hidden xl:inline-flex text-[#24292e]">
                          GitHub
                        </span>
                      </span>
                    </DesktopTopRowItem>
                  </Link>
                </li>
                <li>
                  <Link
                    className="bg-[#7289da]"
                    target="_blank"
                    to="https://discord.com/invite/Ep7NKVXUZA"
                  >
                    <DesktopTopRowItem>
                      <span className="inline-flex gap-2 items-center">
                        <i className="icon icon-[fa-discord] text-xl text-[#7289da]" />
                        <span className="text-sm font-semibold hidden xl:inline-flex text-[#7289da]">
                          Discord
                        </span>
                      </span>
                    </DesktopTopRowItem>
                  </Link>
                </li>
                <li>
                  <Link to={gameNavigation.preferencesPath}>
                    <DesktopTopRowItem
                      aria-label={t('Preferences')}
                      title={t('Preferences')}
                    >
                      <i className="icon icon-[md-settings] text-xl" />
                    </DesktopTopRowItem>
                  </Link>
                </li>
                <li>
                  <Link to="/">
                    <DesktopTopRowItem
                      aria-label={t('Logout')}
                      title={t('Logout')}
                    >
                      <i className="icon icon-[rx-exit] text-xl text-red-500" />
                    </DesktopTopRowItem>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex justify-between container mx-auto">
            <div className="flex flex-1 items-center">
              <Suspense fallback={null}>
                <VillageSelect />
              </Suspense>
            </div>
            <nav className="flex flex-4 justify-center w-fit lg:-translate-y-4 max-h-11 pt-1">
              <ul className="hidden lg:flex gap-1 xl:gap-4 justify-center items-center">
                <li>
                  <Link to={gameNavigation.statisticsPath}>
                    <NavigationSideItem
                      aria-label={t('Statistics')}
                      title={t('Statistics')}
                    >
                      <i className="icon icon-[go-graph] text-xl" />
                    </NavigationSideItem>
                  </Link>
                </li>
                <li>
                  <QuestsNavigationItem />
                </li>
                <li>
                  <Link to={gameNavigation.overviewPath}>
                    <NavigationSideItem
                      aria-label={t('Overview')}
                      title={t('Overview')}
                    >
                      <i className="icon icon-[ci-circle-list] text-xl" />
                    </NavigationSideItem>
                  </Link>
                </li>
                <li>
                  <ul className="flex gap-1 xl:gap-2 xl:mx-2">
                    <li>
                      <ResourcesNavigationItem />
                    </li>
                    <li>
                      <VillageNavigationItem />
                    </li>
                    <li>
                      <MapNavigationItem />
                    </li>
                  </ul>
                </li>
                <li>
                  <ReportsNavigationItem />
                </li>
                <li>
                  <AdventuresNavigationItem />
                </li>
                <li>
                  <Link to={gameNavigation.auctionsPath}>
                    <NavigationSideItem
                      aria-label={t('Auctions')}
                      title={t('Auctions')}
                    >
                      <i className="icon icon-[ri-auction-line] text-xl" />
                    </NavigationSideItem>
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="flex flex-1" />
          </div>
        </div>
      )}
      {!isWiderThanLg && (
        <>
          {/* Empty div to bring down the header on mobile devices */}
          <div className="hidden standalone:flex h-12 w-full bg-gray-600" />
          <div className="flex justify-between items-center text-center lg:hidden h-14 w-full gap-6">
            <DiscordLink />
            <VillageSelect />
            <HeroNavigationItem />
          </div>
        </>
      )}
      <div className="flex relative rounded-md lg:rounded-none lg:rounded-b-sm px-2 lg:absolute top-full left-1/2 -translate-x-1/2 bg-card max-w-xl w-full lg:z-20 shadow-lg">
        <ResourceCounters />
      </div>
    </header>
  );
};

const MobileBottomNavigation = () => {
  const { t } = useTranslation();
  const gameNavigation = useGameNavigation();

  const container = useRef<HTMLDivElement>(null);
  const centeredElement = useRef<HTMLLIElement>(null);

  useCenterHorizontally(container, centeredElement);

  // Basically, fixed header, overflow-x & translate-y do not work together at all.
  // There's always either non-working scroll or elements being cut. The way it works now is that technically, nothing is overflowing with translate,
  // we just have a transparent container and some very hacky gradient to make it look like it works.
  // There's also massive Tailwind brain rot on display here. :S
  return (
    <header className="lg:hidden fixed bottom-0 left-0 pb-8 w-full bg-[linear-gradient(0deg,_rgba(255,255,255,1)_0%,_rgba(232,232,232,1)_83%,_rgba(255,255,255,1)_83.1%,_rgba(255,255,255,1)_84%,_rgba(255,255,255,0)_84.1%,_rgba(255,255,255,0)_100%)]">
      <nav
        ref={container}
        className="flex flex-col w-full overflow-x-scroll scrollbar-hidden"
      >
        <ul className="flex w-fit gap-2 justify-between items-center px-2 pt-5 pb-2 mx-auto">
          <li>
            <Link to={gameNavigation.statisticsPath}>
              <NavigationSideItem
                aria-label={t('Statistics')}
                title={t('Statistics')}
              >
                <i className="icon icon-[go-graph] text-2xl" />
              </NavigationSideItem>
            </Link>
          </li>
          <li>
            <AdventuresNavigationItem />
          </li>
          <li>
            <QuestsNavigationItem />
          </li>
          <li>
            <Link to={gameNavigation.overviewPath}>
              <NavigationSideItem
                aria-label={t('Overview')}
                title={t('Overview')}
              >
                <i className="icon icon-[ci-circle-list] text-2xl" />
              </NavigationSideItem>
            </Link>
          </li>
          <li>
            <ul className="flex gap-2 -translate-y-3 mx-2">
              <li>
                <ResourcesNavigationItem />
              </li>
              <li ref={centeredElement}>
                <VillageNavigationItem />
              </li>
              <li>
                <MapNavigationItem />
              </li>
            </ul>
          </li>
          <li>
            <ReportsNavigationItem />
          </li>
          <li>
            <Link to={gameNavigation.preferencesPath}>
              <NavigationSideItem
                aria-label={t('Preferences')}
                title={t('Preferences')}
              >
                <i className="icon icon-[md-settings] text-2xl" />
              </NavigationSideItem>
            </Link>
          </li>
          <li>
            <Link to="/">
              <NavigationSideItem
                aria-label={t('Logout')}
                title={t('Logout')}
              >
                <i className="icon icon-[rx-exit] text-2xl text-red-500" />
              </NavigationSideItem>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export const ErrorBoundary = () => {
  return <p>Layout error</p>;
};

const PageFallback = () => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)] lg:h-[calc(100vh-4.75rem)]">
      <Spinner className="size-16" />
    </div>
  );
};

const GameLayout = () => {
  const { preferences } = usePreferences();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const { timeOfDay, skinVariant, colorScheme, locale } = preferences;

  const { direction } = useTextDirection(locale);

  useEffect(() => {
    const body = document.querySelector('body')!;

    body.classList.add(layoutStyles['background-image']);

    return () => {
      body.classList.remove(clsx(layoutStyles['background-image']));
    };
  }, []);

  useEffect(() => {
    if (!(colorScheme && skinVariant && timeOfDay)) {
      return;
    }
    const html = document.documentElement;

    html.setAttribute('dir', direction);
    html.classList.add(
      colorScheme,
      `skin-variant-${skinVariant}`,
      `time-of-day-${timeOfDay}`,
    );

    return () => {
      html.removeAttribute('dir');
      html.classList.remove(
        colorScheme,
        `skin-variant-${skinVariant}`,
        `time-of-day-${timeOfDay}`,
      );
    };
  }, [skinVariant, timeOfDay, colorScheme, direction]);

  return (
    <CurrentVillageStateProvider>
      <CurrentVillageBuildingQueueContextProvider>
        <Tooltip id="general-tooltip" />
        <TopNavigation />
        <Suspense fallback={null}>
          <TroopMovements />
        </Suspense>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
        <Suspense fallback={null}>
          <ConstructionQueue />
        </Suspense>
        <Suspense fallback={null}>
          <TroopList />
        </Suspense>
        {!isWiderThanLg && <MobileBottomNavigation />}
      </CurrentVillageBuildingQueueContextProvider>
    </CurrentVillageStateProvider>
  );
};

export default GameLayout;
