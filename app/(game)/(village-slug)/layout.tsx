import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { CurrentVillageStateProvider } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import type { Resource } from 'app/interfaces/models/game/resource';
import { clsx } from 'clsx';
import type { PropsWithChildren, ComponentProps, ReactNode } from 'react';
import { Suspense } from 'react';
import { Fragment, memo, useRef } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCenterHorizontally } from 'app/(game)/(village-slug)/hooks/dom/use-center-horizontally';
import {
  Link,
  NavLink,
  type NavLinkProps,
  Outlet,
  useNavigate,
} from 'react-router';
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
import { Tooltip } from 'app/components/tooltip';
import { Spinner } from 'app/components/ui/spinner';
import { CurrentVillageBuildingQueueContextProvider } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { TbMap2, TbShoe } from 'react-icons/tb';
import { MdFace, MdOutlineHolidayVillage, MdSettings } from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';
import { LuBookMarked, LuScrollText } from 'react-icons/lu';
import { PiPathBold } from 'react-icons/pi';
import { FaHome } from 'react-icons/fa';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { RxExit } from 'react-icons/rx';
import { GoGraph } from 'react-icons/go';
import { CiCircleList } from 'react-icons/ci';
import { RiAuctionLine } from 'react-icons/ri';
import { HiStar } from 'react-icons/hi2';
import { PreferencesUpdater } from 'app/(game)/(village-slug)/components/preferences-updater';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/+types/layout';
import { parseRFCFromTile } from 'app/utils/map';
import { Text } from 'app/components/text';

type CounterProps = {
  counter?: number;
};

const Counter = ({ counter }: CounterProps) => {
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

type NavigationSideItemProps = Omit<NavLinkProps, 'children'> & {
  children: ReactNode;
};

const NavigationSideItem = ({
  children,
  ...rest
}: PropsWithChildren<NavigationSideItemProps>) => {
  return (
    <NavLink
      className={clsx(
        'bg-gradient-to-t from-[#f2f2f2] to-[#ffffff]',
        'flex items-center justify-center shadow-md rounded-md px-3 py-2 border border-border relative',
        'transition-transform active:scale-95 active:shadow-inner',
        'lg:size-12 lg:p-0 lg:rounded-full lg:shadow lg:border-0 lg:from-[#a3a3a3] lg:to-[#c8c8c8]',
      )}
      {...rest}
    >
      <span className="lg:size-10 lg:bg-background lg:rounded-full flex items-center justify-center">
        {children}
      </span>
    </NavLink>
  );
};

const DiscordLink = () => {
  return (
    <a
      href="https://discord.com/invite/Ep7NKVXUZA"
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-border relative bg-background"
      title="Discord"
      rel="noopener"
    >
      <span className="flex items-center justify-center">
        <FaDiscord className="text-2xl text-[#7289da]" />
      </span>
    </a>
  );
};

const HeroNavigationItem = () => {
  const { t } = useTranslation();
  const { hero, health, experience } = useHero();
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
      to="hero"
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-border relative bg-gradient-to-t from-[#f2f2f2] to-[#ffffff]"
      aria-label={t('Hero')}
      title={t('Hero')}
    >
      <span className="lg:size-10 flex items-center justify-center">
        <MdFace className="text-2xl" />
      </span>
      {isLevelUpAvailable && (
        <span className="absolute text-center size-4 bg-background top-0 -right-1.5 rounded-full border border-border shadow-md">
          <HiStar className="text-yellow-300 text-sm" />
        </span>
      )}
      <span className="absolute size-4 bg-background bottom-0 -right-1.5 rounded-full border border-border shadow-md inline-flex justify-center items-center">
        {isHeroHome && <FaHome className="text-gray-500 text-xs" />}
        {!isHeroHome && <TbShoe className="text-gray-500 text-xs" />}
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

const DesktopTopRowItem = ({
  children,
  ...rest
}: PropsWithChildren<ComponentProps<'button'>>) => {
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

type NavigationMainItemProps = Omit<NavLinkProps, 'children'> & {
  children: ReactNode;
};

const NavigationMainItem = ({ children, ...rest }: NavigationMainItemProps) => {
  return (
    <NavLink
      type="button"
      className={({ isActive }) =>
        clsx(
          isActive
            ? 'from-[#7da100] to-[#c7e94f]'
            : 'from-[#b8b2a9] to-[#f1f0ee]',
          'bg-gradient-to-t size-14 lg:size-18 rounded-full flex items-center justify-center shadow-lg lg:shadow-none',
          'transition-transform transform-gpu active:scale-95 lg:active:scale-100',
        )
      }
      {...rest}
    >
      <span className="size-12 lg:size-15 bg-background rounded-full flex items-center justify-center">
        {children}
      </span>
    </NavLink>
  );
};

const QuestsNavigationItem = () => {
  const { t } = useTranslation();

  return (
    <NavigationSideItem
      to="quests"
      aria-label={t('Quests')}
      title={t('Quests')}
    >
      <Suspense fallback={null}>
        <QuestsCounter />
      </Suspense>
      <LuBookMarked className="text-2xl" />
    </NavigationSideItem>
  );
};

const AdventuresNavigationItem = () => {
  const { t } = useTranslation();

  return (
    <NavigationSideItem
      to="hero?tab=adventures"
      aria-label={t('Adventures')}
      title={t('Adventures')}
    >
      <Suspense fallback={null}>
        <AdventurePointsCounter />
      </Suspense>
      <PiPathBold className="text-2xl" />
    </NavigationSideItem>
  );
};

const ReportsNavigationItem = () => {
  const { t } = useTranslation();

  return (
    <NavigationSideItem
      to="reports"
      aria-label={t('Reports')}
      title={t('Reports')}
    >
      <Suspense fallback={null}>
        <ReportsCounter />
      </Suspense>
      <LuScrollText className="text-2xl" />
    </NavigationSideItem>
  );
};

const ResourcesNavigationItem = () => {
  const { t } = useTranslation();

  return (
    <NavigationMainItem
      aria-label={t('Resources')}
      title={t('Resources')}
      to="resources"
      prefetch="render"
    >
      <GiWheat className="text-3xl" />
    </NavigationMainItem>
  );
};

const VillageNavigationItem = () => {
  const { t } = useTranslation();

  return (
    <NavigationMainItem
      aria-label={t('Village')}
      title={t('Village')}
      to="village"
      prefetch="render"
    >
      <MdOutlineHolidayVillage className="text-3xl" />
    </NavigationMainItem>
  );
};

const MapNavigationItem = () => {
  const { t } = useTranslation();

  return (
    <NavigationMainItem
      aria-label={t('Map')}
      title={t('Map')}
      to="map"
      prefetch="render"
    >
      <TbMap2 className="text-3xl" />
    </NavigationMainItem>
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

const VillageSelect = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getNewVillageUrl } = useGameNavigation();
  const { playerVillages } = usePlayerVillages();
  const { currentVillage } = useCurrentVillage();

  const resourceFieldComposition = parseRFCFromTile(currentVillage.RFC).join(
    '-',
  );

  return (
    <Select
      onValueChange={(value) => navigate(getNewVillageUrl(value))}
      value={currentVillage.slug}
    >
      <SelectTrigger
        title={t('Village select')}
        aria-label={t('Village select')}
        className="flex flex-1"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {playerVillages.map(({ slug, name, id, coordinates }) => {
          const { x, y } = coordinates;
          const formattedId = `${x}|${y}`;
          return (
            <SelectItem
              key={id}
              value={slug}
            >
              <Text className="text-xs sm:text-sm">
                {name} ({formattedId}) | {resourceFieldComposition}
              </Text>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

const TopNavigation = () => {
  const { t } = useTranslation();
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
                        <FaGithub className="text-xl text-[#24292e]" />
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
                        <FaDiscord className="text-xl text-[#7289da]" />
                        <span className="text-sm font-semibold hidden xl:inline-flex text-[#7289da]">
                          Discord
                        </span>
                      </span>
                    </DesktopTopRowItem>
                  </Link>
                </li>
                <li>
                  <Link to="preferences">
                    <DesktopTopRowItem
                      aria-label={t('Preferences')}
                      title={t('Preferences')}
                    >
                      <MdSettings className="text-xl" />
                    </DesktopTopRowItem>
                  </Link>
                </li>
                <li>
                  <Link to="/game-worlds">
                    <DesktopTopRowItem
                      aria-label={t('Logout')}
                      title={t('Logout')}
                    >
                      <RxExit className="text-xl text-red-500" />
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
                  <NavigationSideItem
                    to="statistics"
                    aria-label={t('Statistics')}
                    title={t('Statistics')}
                  >
                    <GoGraph className="text-xl" />
                  </NavigationSideItem>
                </li>
                <li>
                  <QuestsNavigationItem />
                </li>
                <li>
                  <NavigationSideItem
                    to="overview"
                    aria-label={t('Overview')}
                    title={t('Overview')}
                  >
                    <CiCircleList className="text-xl" />
                  </NavigationSideItem>
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
                  <NavigationSideItem
                    to="hero?tab=auctions"
                    aria-label={t('Auctions')}
                    title={t('Auctions')}
                  >
                    <RiAuctionLine className="text-xl" />
                  </NavigationSideItem>
                </li>
              </ul>
            </nav>
            <div className="flex flex-1" />
          </div>
        </div>
      )}
      {!isWiderThanLg && (
        <div className="flex justify-between items-center text-center lg:hidden h-14 w-full gap-6">
          <DiscordLink />
          <VillageSelect />
          <HeroNavigationItem />
        </div>
      )}
      <div className="flex relative rounded-md lg:rounded-none lg:rounded-b-sm px-2 lg:absolute top-full left-1/2 -translate-x-1/2 bg-card max-w-xl w-full lg:z-20 shadow-lg">
        <ResourceCounters />
      </div>
    </header>
  );
};

const MobileBottomNavigation = () => {
  const { t } = useTranslation();

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
            <NavigationSideItem
              to="statistics"
              aria-label={t('Statistics')}
              title={t('Statistics')}
            >
              <GoGraph className="text-2xl" />
            </NavigationSideItem>
          </li>
          <li>
            <AdventuresNavigationItem />
          </li>
          <li>
            <QuestsNavigationItem />
          </li>
          <li>
            <NavigationSideItem
              to="overview"
              aria-label={t('Overview')}
              title={t('Overview')}
            >
              <CiCircleList className="text-2xl" />
            </NavigationSideItem>
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
            <NavigationSideItem
              to="preferences"
              aria-label={t('Preferences')}
              title={t('Preferences')}
            >
              <MdSettings className="text-2xl" />
            </NavigationSideItem>
          </li>
          <li>
            <NavigationSideItem
              to="/game-worlds"
              aria-label={t('Logout')}
              title={t('Logout')}
            >
              <RxExit className="text-2xl text-red-500" />
            </NavigationSideItem>
          </li>
        </ul>
      </nav>
    </header>
  );
};

const PageFallback = () => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)] lg:h-[calc(100vh-4.75rem)]">
      <Spinner className="size-16" />
    </div>
  );
};

const GameLayout = memo<Route.ComponentProps>(
  () => {
    const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

    return (
      <CurrentVillageStateProvider>
        <CurrentVillageBuildingQueueContextProvider>
          <Tooltip id="general-tooltip" />
          <TopNavigation />
          <TroopMovements />
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
          <ConstructionQueue />
          <TroopList />
          {!isWiderThanLg && <MobileBottomNavigation />}
          <PreferencesUpdater />
        </CurrentVillageBuildingQueueContextProvider>
      </CurrentVillageStateProvider>
    );
  },
  (prev, next) => {
    return prev.params.villageSlug === next.params.villageSlug;
  },
);

export default GameLayout;
