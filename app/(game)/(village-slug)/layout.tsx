import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { CurrentResourceProvider } from 'app/(game)/(village-slug)/providers/current-resources-provider';
import { GameEngineProvider } from 'app/(game)/(village-slug)/providers/game-engine-provider';
import type { Resource } from 'app/interfaces/models/game/resource';
import clsx from 'clsx';
import type React from 'react';
import { Fragment, useEffect, useRef } from 'react';
import { GiWheat } from 'react-icons/gi';
import { LuScrollText } from 'react-icons/lu';
import { MdFace, MdOutlineHolidayVillage, MdSettings } from 'react-icons/md';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { FaBookBookmark, FaDiscord, FaGithub } from 'react-icons/fa6';
import { GoGraph } from 'react-icons/go';
import { PiPathBold } from 'react-icons/pi';
import { TbMap2 } from 'react-icons/tb';
import { useCenterHorizontally } from 'app/(game)/(village-slug)/hooks/dom/use-center-horizontally';
import { LinkWithState } from 'app/components/link-with-state';
import { Link, Outlet } from 'react-router';
import { CiCircleList } from 'react-icons/ci';
import { RxExit } from 'react-icons/rx';
import { RiAuctionLine } from 'react-icons/ri';
import { CountdownProvider } from 'app/(game)/(village-slug)/providers/countdown-provider';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { FaHome } from 'react-icons/fa';
import { useAdventurePoints } from 'app/(game)/(village-slug)/hooks/use-adventure-points';
import { ResourceCounter } from 'app/(game)/(village-slug)/components/resource-counter';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { HiStar } from 'react-icons/hi';
import { calculateHeroLevel } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { Icon } from 'app/components/icon';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { formatNumber } from 'app/utils/common';
import layoutStyles from './layout.module.scss';

type NavigationSideItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  counter?: number;
};

const NavigationSideItem: React.FCWithChildren<NavigationSideItemProps> = ({ children, counter = 0, ...rest }) => {
  return (
    <button
      type="button"
      className="
        flex items-center justify-center shadow-md rounded-xs px-3 py-2 border border-gray-300 relative
        bg-gradient-to-t from-[#f2f2f2] to-[#ffffff]
        lg:size-12 lg:p-0 lg:rounded-full lg:shadow lg:border-0 lg:bg-gradient-to-t lg:from-[#a3a3a3] lg:to-[#c8c8c8]
      "
      {...rest}
    >
      <span className="lg:size-10 lg:bg-white lg:rounded-full flex items-center justify-center">{children}</span>
      {counter > 0 && (
        <span
          className="absolute size-5 lg:size-6 text-sm font-medium bg-white top-0 -right-3 rounded-full border lg:border-2 border-gray-300 shadow-md inline-flex justify-center items-center">
          {counter}
        </span>
      )}
    </button>
  );
};

const DiscordLink = () => {
  return (
    <Link
      to="https://discord.com/invite/Ep7NKVXUZA"
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-gray-300 relative bg-white"
    >
      <span className="flex items-center justify-center">
        <FaDiscord className="text-2xl text-[#7289da]" />
      </span>
    </Link>
  );
};

const HeroNavigationItem = () => {
  const { hero } = useHero();
  const { heroPath } = useGameNavigation();

  const { level } = calculateHeroLevel(hero.stats.experience);

  // Each level gets you 4 selectable attributes to pick. Show icon if user has currently selected less than total possible.
  const isLevelUpAvailable = (level + 1) * 4 > Object.values(hero.selectableAttributes).reduce((total, curr) => total + curr, 0);

  return (
    <Link
      to={heroPath}
      className="flex items-center justify-center shadow-md rounded-full p-2.5 border border-gray-300 relative bg-gradient-to-t from-[#f2f2f2] to-[#ffffff]"
    >
      <span className="lg:size-10 flex items-center justify-center">
        <MdFace className="text-2xl" />
      </span>
      {isLevelUpAvailable && (
        <span className="absolute text-center size-4 bg-white top-0 -right-1.5 rounded-full border border-gray-300 shadow-md">
          <HiStar className="text-yellow-300 text-sm" />
        </span>
      )}
      <span
        className="absolute size-4 bg-white bottom-0 -right-1.5 rounded-full border border-gray-300 shadow-md inline-flex justify-center items-center">
        <FaHome className="text-gray-500 text-xs" />
      </span>
    </Link>
  );
};

const DesktopTopRowItem: React.FCWithChildren = ({ children }) => {
  return (
    <button
      type="button"
      className="px-3 py-0.5 bg-gradient-to-t from-[#f2f2f2] to-[#ffffff] flex items-center justify-center"
    >
      {children}
    </button>
  );
};

type NavigationMainItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive: boolean;
};

const NavigationMainItem: React.FCWithChildren<NavigationMainItemProps> = ({ children, ...rest }) => {
  const { isActive, ...htmlProps } = rest;

  return (
    <button
      type="button"
      className={clsx(
        isActive ? 'from-[#7da100] to-[#c7e94f]' : 'from-[#b8b2a9] to-[#f1f0ee]',
        'bg-gradient-to-t size-14 lg:size-18 rounded-full flex items-center justify-center shadow-lg lg:shadow-none',
      )}
      {...htmlProps}
    >
      <span className="size-12 lg:size-15 bg-white rounded-full flex items-center justify-center">{children}</span>
    </button>
  );
};

const ResourceCounters = () => {
  const { buildingWheatConsumption, buildingWheatLimit } = useComputedEffect('wheatProduction');

  return (
    <div className="flex w-full lg:border-none py-0.5 mx-auto gap-0.5 lg:gap-2">
      {(['wood', 'clay', 'iron', 'wheat'] as Resource[]).map((resource: Resource, index) => (
        <Fragment key={resource}>
          <ResourceCounter resource={resource} />
          {index !== 3 && <span className="w-[2px] h-full bg-gray-300" />}
        </Fragment>
      ))}
      <span className="flex gap-0.5 lg:hidden h-full min-w-10">
        <span className="w-[2px] h-full bg-gray-300" />
        <span className="flex flex-col justify-between gap-0.5 w-full">
          <span className="inline-flex justify-between items-center gap-0.5">
            <Icon
              className="size-4"
              type="population"
            />
            <span className="text-2xs font-medium">{formatNumber(Math.abs(buildingWheatConsumption))}</span>
          </span>
          <span className="h-[2px] w-full bg-gray-300" />
          <span className="flex justify-between items-center gap-0.5">
            <Icon
              className="size-4"
              type="wheatProduction"
            />
            <span className="text-2xs font-medium">{formatNumber(buildingWheatLimit)}</span>
          </span>
        </span>
      </span>
    </div>
  );
};

const VillageSelect = () => {
  const { villageSlug } = useRouteSegments();
  const { switchToVillage } = useGameNavigation();
  const { playerVillages } = usePlayerVillages();
  const { currentVillage } = useCurrentVillage();

  return (
    <select
      className="border-2 border-gray-300 rounded-sm truncate overflow-hidden text-center whitespace-nowrap w-full max-w-xs py-2"
      defaultValue={currentVillage.slug}
      onChange={(event) => switchToVillage(event.target.value)}
    >
      {playerVillages.map(({ id, slug, name }) => (
        <option
          disabled={slug === villageSlug}
          key={id}
          value={slug}
        >
          {name} ({id})
        </option>
      ))}
    </select>
  );
};

const TopNavigation = () => {
  const { adventurePoints } = useAdventurePoints();
  const gameNavigation = useGameNavigation();
  const { currentVillage } = useCurrentVillage();

  const [x, y] = currentVillage.id.split('|');
  const currentVillageMapPath = `${gameNavigation.mapPath}?x=${x}&y=${y}`;

  return (
    <header className="flex flex-col w-full relative">
      <div className="flex-col hidden lg:flex shadow-sm bg-white">
        <div className="hidden lg:flex w-full bg-gray-300 py-1 px-2">
          <nav className="hidden lg:flex justify-end container mx-auto">
            <ul className="flex gap-1">
              <li>
                <LinkWithState
                  target="_blank"
                  to="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                >
                  <DesktopTopRowItem>
                    <span className="inline-flex gap-1 items-center">
                      <span className="text-sm hidden xl:inline-flex">GitHub</span> <FaGithub className="text-xl" />
                    </span>
                  </DesktopTopRowItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState
                  target="_blank"
                  to="https://discord.com/invite/Ep7NKVXUZA"
                >
                  <DesktopTopRowItem>
                    <span className="inline-flex gap-1 items-center">
                      <span className="text-sm hidden xl:inline-flex">Discord</span> <FaDiscord className="text-xl" />
                    </span>
                  </DesktopTopRowItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to={gameNavigation.preferencesPath}>
                  <DesktopTopRowItem>
                    <MdSettings className="text-xl" />
                  </DesktopTopRowItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to="/">
                  <DesktopTopRowItem>
                    <RxExit className="text-xl text-red-500" />
                  </DesktopTopRowItem>
                </LinkWithState>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex justify-between container mx-auto">
          <div className="flex flex-1 items-center">
            <VillageSelect />
          </div>
          <nav className="flex flex-4 justify-center w-fit lg:-translate-y-4 max-h-11 pt-1">
            <ul className="hidden lg:flex gap-1 xl:gap-4 justify-center items-center">
              <li>
                <LinkWithState to={gameNavigation.statisticsPath}>
                  <NavigationSideItem>
                    <GoGraph className="text-xl" />
                  </NavigationSideItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to={gameNavigation.questsPath}>
                  <NavigationSideItem>
                    <FaBookBookmark className="text-xl" />
                  </NavigationSideItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to={gameNavigation.overviewPath}>
                  <NavigationSideItem>
                    <CiCircleList className="text-xl" />
                  </NavigationSideItem>
                </LinkWithState>
              </li>
              <li>
                <ul className="flex gap-1 xl:gap-2 xl:mx-4">
                  <li>
                    <LinkWithState to={gameNavigation.resourcesPath}>
                      <NavigationMainItem isActive={gameNavigation.isResourcesPageOpen}>
                        <GiWheat className="text-3xl" />
                      </NavigationMainItem>
                    </LinkWithState>
                  </li>
                  <li>
                    <LinkWithState to={gameNavigation.villagePath}>
                      <NavigationMainItem isActive={gameNavigation.isVillagePageOpen}>
                        <MdOutlineHolidayVillage className="text-3xl" />
                      </NavigationMainItem>
                    </LinkWithState>
                  </li>
                  <li>
                    <LinkWithState to={currentVillageMapPath}>
                      <NavigationMainItem isActive={gameNavigation.isMapPageOpen}>
                        <TbMap2 className="text-3xl" />
                      </NavigationMainItem>
                    </LinkWithState>
                  </li>
                </ul>
              </li>
              <li>
                <LinkWithState to={gameNavigation.reportsPath}>
                  <NavigationSideItem>
                    <LuScrollText className="text-xl" />
                  </NavigationSideItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to={gameNavigation.adventuresPath}>
                  <NavigationSideItem counter={adventurePoints.amount}>
                    <PiPathBold className="text-xl" />
                  </NavigationSideItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to={gameNavigation.auctionsPath}>
                  <NavigationSideItem>
                    <RiAuctionLine className="text-xl" />
                  </NavigationSideItem>
                </LinkWithState>
              </li>
            </ul>
          </nav>
          <div className="flex flex-1" />
        </div>
      </div>
      {/* Empty div to bring down the header on mobile devices */}
      <div className="hidden standalone:flex h-12 w-full bg-gray-600" />
      <div
        className="flex justify-between items-center text-center lg:hidden h-14 w-full px-2 gap-4 bg-gradient-to-r from-gray-200 via-white to-gray-200">
        <DiscordLink />
        <VillageSelect />
        <HeroNavigationItem />
      </div>
      <div
        className="flex relative lg:absolute top-full left-1/2 -translate-x-1/2 bg-white max-w-xl w-full lg:z-20 px-2 shadow-lg border-b border-b-gray-200 lg:border-b-none">
        <ResourceCounters />
      </div>
    </header>
  );
};

const MobileBottomNavigation = () => {
  const gameNavigation = useGameNavigation();
  const { currentVillage } = useCurrentVillage();

  const container = useRef<HTMLDivElement>(null);

  const [x, y] = currentVillage.id.split('|');
  const currentVillageMapPath = `${gameNavigation.mapPath}?x=${x}&y=${y}`;

  useCenterHorizontally(container);

  // This is literally the hackiest html I've ever written. Basically, fixed header, overflow-x & translate-y do not work together at all.
  // There's always either non-working scroll or elements being cut. The way it works now is that technically, nothing is overflowing with translate,
  // we just have a transparent container and some very hacky gradient to make it look like it works.
  // There's also massive Tailwind brainrot on display here, God help us
  return (
    <header
      className="lg:hidden fixed bottom-0 left-0 pb-8 w-full bg-[linear-gradient(0deg,_rgba(255,255,255,1)_0%,_rgba(232,232,232,1)_83%,_rgba(255,255,255,1)_83.1%,_rgba(255,255,255,1)_84%,_rgba(255,255,255,0)_84.1%,_rgba(255,255,255,0)_100%)]">
      <nav
        ref={container}
        className="flex flex-col w-full overflow-x-scroll scrollbar-hidden"
      >
        <ul className="flex w-fit gap-2 justify-between items-center px-2 pt-5 pb-2 mx-auto">
          <li>
            <LinkWithState to={gameNavigation.statisticsPath}>
              <NavigationSideItem>
                <GoGraph className="text-2xl" />
              </NavigationSideItem>
            </LinkWithState>
          </li>
          <li>
            <LinkWithState to={gameNavigation.adventuresPath}>
              <NavigationSideItem>
                <PiPathBold className="text-2xl" />
              </NavigationSideItem>
            </LinkWithState>
          </li>
          <li>
            <LinkWithState to={gameNavigation.questsPath}>
              <NavigationSideItem>
                <FaBookBookmark className="text-2xl" />
              </NavigationSideItem>
            </LinkWithState>
          </li>
          <li>
            <ul className="flex gap-2 -translate-y-3 mx-2">
              <li>
                <LinkWithState to={gameNavigation.resourcesPath}>
                  <NavigationMainItem isActive={gameNavigation.isResourcesPageOpen}>
                    <GiWheat className="text-2xl" />
                  </NavigationMainItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to={gameNavigation.villagePath}>
                  <NavigationMainItem isActive={gameNavigation.isVillagePageOpen}>
                    <MdOutlineHolidayVillage className="text-2xl" />
                  </NavigationMainItem>
                </LinkWithState>
              </li>
              <li>
                <LinkWithState to={currentVillageMapPath}>
                  <NavigationMainItem isActive={gameNavigation.isMapPageOpen}>
                    <TbMap2 className="text-2xl" />
                  </NavigationMainItem>
                </LinkWithState>
              </li>
            </ul>
          </li>
          <li>
            <LinkWithState to={gameNavigation.reportsPath}>
              <NavigationSideItem>
                <LuScrollText className="text-2xl" />
              </NavigationSideItem>
            </LinkWithState>
          </li>

          <li>
            <LinkWithState to={gameNavigation.preferencesPath}>
              <NavigationSideItem>
                <MdSettings className="text-2xl" />
              </NavigationSideItem>
            </LinkWithState>
          </li>
          <li>
            <LinkWithState to="/">
              <NavigationSideItem>
                <RxExit className="text-2xl text-red-500" />
              </NavigationSideItem>
            </LinkWithState>
          </li>
        </ul>
      </nav>
    </header>
  );
};

const TroopMovements = () => {
  return null;
};

const ConstructionQueue = () => {
  return null;
};

const TroopList = () => {
  return null;
};

export const ErrorBoundary = () => {
  return <p>Layout error</p>;
};

const GameLayout = () => {
  const { timeOfDay, skinVariant, colorScheme } = usePreferences();

  useEffect(() => {
    const body = document.querySelector('body')!;

    body.classList.add(layoutStyles['background-image']);

    return () => {
      body.classList.remove(layoutStyles['background-image']);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;

    html.setAttribute('data-color-scheme', colorScheme);
    html.setAttribute('data-skin-variant', skinVariant);
    html.setAttribute('data-time-of-day', timeOfDay);

    return () => {
      html.removeAttribute('data-color-scheme');
      html.removeAttribute('data-skin-variant');
      html.removeAttribute('data-time-of-day');
    };
  }, [skinVariant, timeOfDay, colorScheme]);

  return (
    <GameEngineProvider>
      <CurrentResourceProvider>
        <CountdownProvider>
          <TopNavigation />
          <TroopMovements />
          <Outlet />
          <ConstructionQueue />
          <TroopList />
          <MobileBottomNavigation />
        </CountdownProvider>
      </CurrentResourceProvider>
    </GameEngineProvider>
  );
};

export default GameLayout;
