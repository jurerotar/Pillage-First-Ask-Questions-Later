import { clsx } from 'clsx';
import {
  type ComponentProps,
  Fragment,
  memo,
  type PropsWithChildren,
  type ReactNode,
  Suspense,
  use,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { CiCircleList } from 'react-icons/ci';
import { FaHome } from 'react-icons/fa';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { GiWheat } from 'react-icons/gi';
import { GoGraph } from 'react-icons/go';
import { HiStar } from 'react-icons/hi2';
import { LuBookMarked, LuScrollText } from 'react-icons/lu';
import { MdFace, MdOutlineHolidayVillage, MdSettings } from 'react-icons/md';
import { PiListChecks, PiPathBold } from 'react-icons/pi';
import { RiAuctionLine } from 'react-icons/ri';
import { RxExit } from 'react-icons/rx';
import { TbMap2, TbShoe } from 'react-icons/tb';
import {
  Link,
  NavLink,
  type NavLinkProps,
  Outlet,
  type ShouldRevalidateFunction,
  useNavigate,
} from 'react-router';
import type { Resource } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { parseResourcesFromRFC } from '@pillage-first/utils/map';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/+types/layout';
import { ConstructionQueue } from 'app/(game)/(village-slug)/components/construction-queue';
import {
  DeveloperToolsButton,
  DeveloperToolsConsole,
} from 'app/(game)/(village-slug)/components/developer-tools-console';
import { PreferencesUpdater } from 'app/(game)/(village-slug)/components/preferences-updater';
import { ResourceCounter } from 'app/(game)/(village-slug)/components/resource-counter';
import { TroopList } from 'app/(game)/(village-slug)/components/troop-list';
import { TroopMovements } from 'app/(game)/(village-slug)/components/troop-movements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCenterHorizontally } from 'app/(game)/(village-slug)/hooks/dom/use-center-horizontally';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useCollectableQuestCount } from 'app/(game)/(village-slug)/hooks/use-collectable-quest-count';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useHeroAdventures } from 'app/(game)/(village-slug)/hooks/use-hero-adventures';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { calculateHeroLevel } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { CurrentVillageBuildingQueueContextProvider } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import {
  CurrentVillageStateContext,
  CurrentVillageStateProvider,
} from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { VillageSlugProvider } from 'app/(game)/(village-slug)/providers/village-slug-provider';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Tooltip } from 'app/components/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { Separator } from 'app/components/ui/separator';
import { Spinner } from 'app/components/ui/spinner';
import { useDialog } from 'app/hooks/use-dialog';

const closeGameWorld = (apiWorker: Worker): void => {
  const handler = ({ data }: MessageEvent) => {
    const { type } = data;

    if (type === 'WORKER_CLOSE_SUCCESS') {
      apiWorker.removeEventListener('message', handler);
      apiWorker.terminate();
    }
  };

  apiWorker.addEventListener('message', handler);
  apiWorker.postMessage({ type: 'WORKER_CLOSE' });
};

const TOOLTIP_DELAY_SHOW = 500;

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
  const { available } = useHeroAdventures();
  return <Counter counter={available} />;
};

const QuestsCounter = () => {
  const { collectableQuestCount } = useCollectableQuestCount();
  return <Counter counter={collectableQuestCount} />;
};

type NavigationSideItemProps = Partial<NavLinkProps> & {
  counter?: ReactNode;
  onClick?: () => void;
};

const NavigationSideItem = ({
  children,
  counter,
  ...rest
}: PropsWithChildren<NavigationSideItemProps>) => {
  const content = (
    <span className="lg:size-10 lg:bg-background lg:rounded-full flex items-center justify-center">
      {children}
    </span>
  );

  const { to, ...restWithoutTo } = rest;

  const commonProps = {
    'data-tooltip-id': 'general-tooltip' as const,
    'data-tooltip-delay-show': TOOLTIP_DELAY_SHOW,
    'data-tooltip-class-name': 'hidden lg:flex',
    tabIndex: 0,
    className: clsx(
      'bg-linear-to-t from-[#f2f2f2] to-[#ffffff]',
      'flex items-center justify-center shadow-md rounded-md px-3 py-2 border border-border relative',
      'transition-transform active:scale-95 active:shadow-inner',
      'lg:size-12 lg:p-0 lg:rounded-full lg:shadow lg:border-0 lg:from-[#a3a3a3] lg:to-[#c8c8c8]',
      'lg:transition-colors lg:hover:from-[#9a9a9a] lg:hover:to-[#bfbfbf]',
    ),
    ...restWithoutTo,
  };

  return (
    <div className="relative">
      {counter}
      {to ? (
        <NavLink
          {...(commonProps as NavLinkProps)}
          to={to}
        >
          {content}
        </NavLink>
      ) : (
        <button
          type="button"
          {...(commonProps as ComponentProps<'button'>)}
        >
          {content}
        </button>
      )}
    </div>
  );
};

const DesktopPopulation = () => {
  const { computedWheatProductionEffect } = use(CurrentVillageStateContext);

  const { population, buildingWheatLimit } = computedWheatProductionEffect;

  return (
    <div className="flex gap-2">
      <div className="flex gap-2 justify-center items-center rounded-sm border border-border p-1 my-1">
        <Icon
          type="population"
          className="min-w-4"
        />
        <span className="text-foreground text-sm">
          {formatNumber(population)}
        </span>
      </div>
      <div className="flex gap-2 justify-center items-center rounded-sm border border-border p-1 my-1">
        <Icon
          type="freeCrop"
          className="min-w-3"
        />
        <span className="text-foreground text-sm">
          {buildingWheatLimit > 99 ? '+99' : buildingWheatLimit}
        </span>
      </div>
    </div>
  );
};

const VillageOverviewDesktopItem = () => {
  const { t } = useTranslation();

  return (
    <NavLink
      to="overview"
      aria-label={t('Overview')}
      data-tooltip-content={t('Overview')}
      data-tooltip-id="general-tooltip"
      data-tooltip-delay-show={TOOLTIP_DELAY_SHOW}
      tabIndex={0}
      className={clsx(
        'flex items-center justify-center shadow-md rounded-md p-1.5 border border-border relative',
        'transition-transform active:scale-95 active:shadow-inner',
        'lg:transition-colors',
      )}
    >
      <span className="lg:bg-background rounded-md flex items-center justify-center">
        <CiCircleList className="text-xl" />
      </span>
    </NavLink>
  );
};

const VillageOverviewMobileItem = () => {
  const { t } = useTranslation();
  const { computedWheatProductionEffect } = use(CurrentVillageStateContext);

  const { population, buildingWheatLimit } = computedWheatProductionEffect;

  return (
    <Link
      to="overview"
      tabIndex={0}
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-border relative bg-background transition-transform active:scale-95"
      aria-label={t('Village overview')}
    >
      <span className="flex items-center justify-center">
        <PiListChecks className="text-2xl" />
      </span>
      <span className="inline-flex items-center justify-between bg-background px-0.5 absolute top-0 left-8 h-4 w-9 rounded-full border border-border shadow-md">
        <Icon
          type="population"
          className="text-xs"
        />
        <span className="text-foreground text-2xs">
          {formatNumber(population)}
        </span>
      </span>
      <span className="inline-flex items-center justify-between bg-background px-0.5 absolute bottom-0 left-8 h-4 w-9 rounded-full border border-border shadow-md">
        <Icon
          type="freeCrop"
          className="text-2xs"
        />
        <span className="text-foreground text-2xs">
          {buildingWheatLimit > 99 ? '+99' : buildingWheatLimit}
        </span>
      </span>
    </Link>
  );
};

const HeroNavigationItem = () => {
  const { t } = useTranslation();
  const { hero, health, experience } = useHero();
  const { villageTroops } = useVillageTroops();

  const isHeroHome = useMemo(() => {
    return villageTroops.some(({ unitId }) => unitId === 'HERO');
  }, [villageTroops]);

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
      tabIndex={0}
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-border relative bg-linear-to-t from-[#f2f2f2] to-[#ffffff] transition-transform active:scale-95"
      aria-label={t('Hero')}
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
      data-tooltip-id="general-tooltip"
      data-tooltip-delay-show={TOOLTIP_DELAY_SHOW}
      data-tooltip-class-name="hidden lg:flex"
      type="button"
      className="
        px-3 py-0.5 border-2 border-white rounded-sm bg-linear-to-t bg-card
        flex items-center justify-center
        transition-transform active:scale-95 active:shadow-inner
        lg:transition-colors lg:hover:bg-gray-50
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
      data-tooltip-id="general-tooltip"
      data-tooltip-class-name="hidden lg:flex"
      data-tooltip-delay-show={TOOLTIP_DELAY_SHOW}
      tabIndex={0}
      className={({ isActive }) =>
        clsx(
          isActive
            ? 'from-[#7da100] to-[#c7e94f] lg:hover:from-[#728f00] lg:hover:to-[#b8dc45]'
            : 'from-[#b8b2a9] to-[#f1f0ee] lg:hover:from-[#aba5a0] lg:hover:to-[#e8e7e5]',
          'bg-linear-to-t size-14 lg:size-18 rounded-full flex items-center justify-center shadow-lg lg:shadow-none',
          'transition-transform transform-gpu active:scale-95',
          'lg:transition-colors',
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
      data-tooltip-content={t('Quests')}
      counter={
        <Suspense fallback={null}>
          <QuestsCounter />
        </Suspense>
      }
    >
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
      data-tooltip-content={t('Adventures')}
      counter={
        <Suspense fallback={null}>
          <AdventurePointsCounter />
        </Suspense>
      }
    >
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
      data-tooltip-content={t('Reports')}
      counter={
        <Suspense fallback={null}>
          <ReportsCounter />
        </Suspense>
      }
    >
      <LuScrollText className="text-2xl" />
    </NavigationSideItem>
  );
};

const ResourcesNavigationItem = () => {
  const { t } = useTranslation();

  return (
    <NavigationMainItem
      aria-label={t('Resources')}
      data-tooltip-delay-show={TOOLTIP_DELAY_SHOW}
      data-tooltip-content={t('Resources')}
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
      data-tooltip-delay-show={TOOLTIP_DELAY_SHOW}
      data-tooltip-content={t('Village')}
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
      data-tooltip-delay-show={TOOLTIP_DELAY_SHOW}
      data-tooltip-content={t('Map')}
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
      {(['wood', 'clay', 'iron', 'wheat'] satisfies Resource[]).map(
        (resource: Resource, index) => (
          <Fragment key={resource}>
            <ResourceCounter resource={resource} />
            {index !== 3 && <span className="w-0.5 h-full bg-gray-300" />}
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
  const { playerVillages } = usePlayerVillageListing();
  const { currentVillage } = useCurrentVillage();

  const resourceFieldComposition = parseResourcesFromRFC(
    currentVillage.resourceFieldComposition,
  ).join('-');

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

type TopNavigationProps = {
  onDeveloperToolsToggle: () => void;
};

const TopNavigation = ({ onDeveloperToolsToggle }: TopNavigationProps) => {
  const { t } = useTranslation();
  const { apiWorker } = use(ApiContext);
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { preferences } = usePreferences();

  return (
    <header className="flex flex-col w-full p-2 pt-0 lg:p-0 relative bg-linear-to-r from-gray-200 via-white to-gray-200">
      {isWiderThanLg && (
        <div className="flex-col hidden lg:flex shadow-sm bg-card">
          <div className="hidden lg:flex w-full bg-muted py-1 px-2">
            <nav className="hidden lg:flex justify-between container mx-auto">
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
              </ul>
              <ul className="flex gap-1">
                {preferences.isDeveloperToolsConsoleEnabled && (
                  <li>
                    <DesktopTopRowItem
                      aria-label={t('Developer tools')}
                      data-tooltip-content={t('Developer tools')}
                      onClick={onDeveloperToolsToggle}
                    >
                      <DeveloperToolsButton className="text-purple-600 border-purple-500 size-5" />
                    </DesktopTopRowItem>
                  </li>
                )}

                <li>
                  <Link to="statistics">
                    <DesktopTopRowItem
                      aria-label={t('Statistics')}
                      data-tooltip-content={t('Statistics')}
                    >
                      <GoGraph className="text-xl" />
                    </DesktopTopRowItem>
                  </Link>
                </li>
                <li>
                  <Link to="preferences">
                    <DesktopTopRowItem
                      aria-label={t('Preferences')}
                      data-tooltip-content={t('Preferences')}
                    >
                      <MdSettings className="text-xl" />
                    </DesktopTopRowItem>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/game-worlds"
                    onClick={() => {
                      closeGameWorld(apiWorker);
                    }}
                  >
                    <DesktopTopRowItem
                      aria-label={t('Logout')}
                      data-tooltip-content={t('Logout')}
                    >
                      <RxExit className="text-xl text-red-500" />
                    </DesktopTopRowItem>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex justify-between container mx-2 xl:mx-auto">
            <div className="flex flex-1 items-center gap-2">
              <Suspense fallback={null}>
                <VillageSelect />
              </Suspense>
              <VillageOverviewDesktopItem />
            </div>
            <nav className="flex flex-4 justify-center w-fit lg:-translate-y-5 max-h-11 pt-1">
              <ul className="hidden lg:flex gap-3 justify-center items-center">
                <li>
                  <ReportsNavigationItem />
                </li>
                <li>
                  <QuestsNavigationItem />
                </li>
                <li>
                  <ul className="flex mx-1">
                    <li>
                      <ResourcesNavigationItem />
                    </li>
                    <li className="z-2 -mx-2">
                      <VillageNavigationItem />
                    </li>
                    <li>
                      <MapNavigationItem />
                    </li>
                  </ul>
                </li>
                <li>
                  <AdventuresNavigationItem />
                </li>
                <li>
                  <NavigationSideItem
                    to="hero?tab=auctions"
                    aria-label={t('Auctions')}
                    data-tooltip-content={t('Auctions')}
                  >
                    <RiAuctionLine className="text-xl" />
                  </NavigationSideItem>
                </li>
              </ul>
            </nav>
            <div className="flex flex-1 justify-end">
              <DesktopPopulation />
            </div>
          </div>
        </div>
      )}
      {!isWiderThanLg && (
        <div className="flex justify-between items-center text-center lg:hidden h-14 w-full gap-8">
          <VillageOverviewMobileItem />
          <VillageSelect />
          <HeroNavigationItem />
        </div>
      )}
      <div className="flex relative rounded-md px-2 lg:absolute top-full lg:-bottom-16 left-1/2 -translate-x-1/2 bg-card max-w-xl w-full lg:z-5 shadow-lg">
        <ResourceCounters />
      </div>
    </header>
  );
};

type MobileBottomNavigationProps = {
  onDeveloperToolsToggle: () => void;
};

const MobileBottomNavigation = ({
  onDeveloperToolsToggle,
}: MobileBottomNavigationProps) => {
  const { t } = useTranslation();
  const { apiWorker } = use(ApiContext);
  const { preferences } = usePreferences();

  const container = useRef<HTMLDivElement>(null);
  const centeredElement = useRef<HTMLLIElement>(null);

  useCenterHorizontally(container, centeredElement);

  // Basically, fixed header, overflow-x & translate-y do not work together at all.
  // There's always either non-working scroll or elements being cut. The way it works now is that technically, nothing is overflowing with translate,
  // we just have a transparent container and some very hacky gradient to make it look like it works.
  // There's also massive Tailwind brain rot on display here. :S
  return (
    <header className="lg:hidden fixed bottom-0 left-0 pb-safe-or-8 w-full bg-[linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(232,232,232,1)_83%,rgba(255,255,255,1)_83.1%,rgba(255,255,255,1)_84%,rgba(255,255,255,0)_84.1%,rgba(255,255,255,0)_100%)]">
      <nav
        ref={container}
        className="flex flex-col w-full overflow-x-scroll scrollbar-hidden"
      >
        <ul className="flex w-fit gap-2 justify-between items-center px-2 pt-5 pb-2 mx-auto">
          <li>
            <NavigationSideItem
              target="_blank"
              to="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
              aria-label="GitHub"
              title="GitHub"
            >
              <FaGithub className="text-2xl text-[#24292e]" />
            </NavigationSideItem>
          </li>
          <li>
            <NavigationSideItem
              target="_blank"
              to="https://discord.com/invite/Ep7NKVXUZA"
              aria-label="Discord"
              title="Discord"
            >
              <FaDiscord className="text-2xl text-[#7289da]" />
            </NavigationSideItem>
          </li>
          <li>
            <Separator orientation="vertical" />
          </li>
          <li>
            <AdventuresNavigationItem />
          </li>
          <li>
            <QuestsNavigationItem />
          </li>
          <li>
            <ul className="flex -translate-y-3 mx-1">
              <li>
                <ResourcesNavigationItem />
              </li>
              <li
                className="z-2 -mx-2"
                ref={centeredElement}
              >
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
              to="statistics"
              aria-label={t('Statistics')}
              title={t('Statistics')}
            >
              <GoGraph className="text-2xl" />
            </NavigationSideItem>
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
            <Separator orientation="vertical" />
          </li>
          {preferences.isDeveloperToolsConsoleEnabled && (
            <li>
              <NavigationSideItem
                aria-label={t('Developer tools')}
                onClick={onDeveloperToolsToggle}
              >
                <DeveloperToolsButton className="text-purple-600 border-purple-500 size-6" />
              </NavigationSideItem>
            </li>
          )}
          <li>
            <NavigationSideItem
              to="/game-worlds"
              onClick={() => {
                closeGameWorld(apiWorker);
              }}
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

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
  const { villageSlug } = params;

  return {
    villageSlug,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentParams,
  nextParams,
}) => {
  return currentParams.villageSlug !== nextParams.villageSlug;
};

const GameLayout = memo<Route.ComponentProps>(
  ({ params }) => {
    const { villageSlug } = params;
    const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
    const { isOpen, toggleModal } = useDialog();

    return (
      <div className="[-webkit-touch-callout:none]">
        <VillageSlugProvider villageSlug={villageSlug}>
          <CurrentVillageStateProvider>
            <CurrentVillageBuildingQueueContextProvider>
              <Tooltip id="general-tooltip" />
              <TopNavigation onDeveloperToolsToggle={toggleModal} />
              <TroopMovements />
              <Suspense fallback={<PageFallback />}>
                <Outlet />
              </Suspense>
              <ConstructionQueue />
              <TroopList />
              {!isWiderThanLg && (
                <MobileBottomNavigation onDeveloperToolsToggle={toggleModal} />
              )}
              <PreferencesUpdater />
              <DeveloperToolsConsole
                isOpen={isOpen}
                onOpenChange={toggleModal}
              />
            </CurrentVillageBuildingQueueContextProvider>
          </CurrentVillageStateProvider>
        </VillageSlugProvider>
      </div>
    );
  },
  (prev, next) => {
    return prev.params.villageSlug === next.params.villageSlug;
  },
);

export default GameLayout;
