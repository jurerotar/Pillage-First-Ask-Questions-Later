import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import { useCalculatedResource } from 'app/(game)/hooks/use-calculated-resource';
import { CurrentResourceProvider } from 'app/(game)/providers/current-resources-provider';
import { GameEngineProvider } from 'app/(game)/providers/game-engine-provider';
import { Icon } from 'app/components/icon';
import type { Resource } from 'app/interfaces/models/game/resource';
import { formatNumberWithCommas } from 'app/utils/common';
import clsx from 'clsx';
import type React from 'react';
import { Fragment, useRef } from 'react';
import { GiWheat } from 'react-icons/gi';
import { LuScrollText } from 'react-icons/lu';
import { MdOutlineHolidayVillage, MdSettings } from 'react-icons/md';
import { useCurrentVillage } from 'app/(game)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/hooks/use-preferences';
import { FaBookBookmark, FaDiscord, FaGithub, FaStar, FaUser } from 'react-icons/fa6';
import { GoGraph } from 'react-icons/go';
import { PiPathBold } from 'react-icons/pi';
import { TbMap2 } from 'react-icons/tb';
import { useCenterHorizontally } from 'app/(game)/hooks/dom/use-center-horizontally';
import { LinkWithState } from 'app/components/link-with-state';
import { Outlet } from 'react-router';
import { CiCircleList } from 'react-icons/ci';
import { RxExit } from 'react-icons/rx';
import { RiAuctionLine } from 'react-icons/ri';
import { Divider } from 'app/components/divider';
import { CountdownProvider } from 'app/(game)/providers/countdown-provider';
import { useHero } from 'app/(game)/hooks/use-hero';
import layoutStyles from './layout.module.css';
import { FaHome } from 'react-icons/fa';
import { useAdventurePoints } from 'app/(game)/hooks/use-adventure-points';

type ResourceCounterProps = {
  resource: Resource;
};

const ResourceCounter: React.FC<ResourceCounterProps> = ({ resource }) => {
  const { calculatedResourceAmount, hourlyProduction, storageCapacity, isFull, hasNegativeProduction } = useCalculatedResource(resource);

  const storagePercentage = (calculatedResourceAmount / storageCapacity) * 100;
  const productionSign = hasNegativeProduction ? '-' : '+';

  const formattedCurrentAmount = formatNumberWithCommas(calculatedResourceAmount);
  const formattedStorageCapacity = formatNumberWithCommas(storageCapacity);
  const formattedHourlyProduction = formatNumberWithCommas(hourlyProduction);

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center justify-between">
        <Icon
          className="size-4 lg:size-6"
          type={resource}
        />
        <span className="inline-flex items-center">
          <span className="text-xs lg:text-md font-medium leading-none">{formattedCurrentAmount}</span>
          <span className="hidden lg:inline-flex text-xs text-gray-400 font-normal leading-none">/{formattedStorageCapacity}</span>
        </span>
      </div>
      <div className="relative flex h-2 lg:h-2.5 w-full bg-[linear-gradient(#7b746e,#dad8d5,#ebebeb)] shadow-inner border border-[#b8b2a9]">
        <div
          className={clsx(
            isFull || hasNegativeProduction ? 'bg-red-500 border-red-700' : 'bg-green-400 border-green-600',
            'flex h-full border lg:border-2',
          )}
          style={{
            width: `${storagePercentage}%`,
          }}
        />
      </div>
      <div className="flex justify-between lg:justify-end items-center">
        <span className="inline-flex lg:hidden text-2xs md:text-xs">{formattedStorageCapacity}</span>
        <span className="inline-flex text-2xs md:text-xs">
          {productionSign}
          {formattedHourlyProduction}/h
        </span>
      </div>
    </div>
  );
};

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
        <span className="absolute size-5 lg:size-6 text-sm font-medium bg-white top-0 -right-3 rounded-full border lg:border-2 border-gray-300 shadow-md inline-flex justify-center items-center">
          {counter}
        </span>
      )}
    </button>
  );
};

const HeroNavigationItem: React.FCWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const { hero } = useHero();

  const { level, experience, health } = hero.stats;
  const healthAngle = (health / 100) * 180;
  const experienceAngle = 180 - (experience / (level + 1)) * 50 * 180;

  // Each level gets you 4 selectable attributes to pick. Show icon if user has currently selected less than total possible.
  const isLevelUpAvailable = level * 4 > Object.values(hero.selectableAttributes).reduce((total, curr) => total + curr, 0);

  return (
    <button
      type="button"
      className={clsx(
        layoutStyles['hero-stats'],
        'bg-gradient-to-t size-13 lg:size-18 rounded-full flex items-center justify-center relative shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4)] lg:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.4)]',
      )}
      {...props}
      style={
        {
          '--health-angle': `${healthAngle}deg`,
          '--experience-angle': `${experienceAngle}deg`,
        } as React.CSSProperties
      }
    >
      <span className={clsx(layoutStyles.divider, layoutStyles.top)} />
      <span className={clsx(layoutStyles.divider, layoutStyles.bottom)} />
      <span className="size-9.5 lg:size-14 bg-white rounded-full flex items-center justify-center shadow-[0_0_0_1px_rgba(0,0,0,0.4)] lg:shadow-[0_0_0_2px_rgba(0,0,0,0.4)]">
        <FaUser className="text-2xl" />
      </span>

      {isLevelUpAvailable && (
        <span className="absolute size-5 lg:size-6 bg-white top-0 -right-3 rounded-full border lg:border-2 border-gray-300 shadow-lg inline-flex justify-center items-center">
          <FaStar className="text-yellow-300 text-xs" />
        </span>
      )}
      <span className="absolute size-5 lg:size-6 bg-white bottom-0 -right-3 rounded-full border lg:border-2 border-gray-300 shadow-md lg:shadow-none inline-flex justify-center items-center">
        <FaHome className="text-xs" />
      </span>
    </button>
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
        'bg-gradient-to-t size-13 lg:size-18 rounded-full flex items-center justify-center shadow-lg lg:shadow-none',
      )}
      {...htmlProps}
    >
      <span className="size-11 lg:size-15 bg-white rounded-full flex items-center justify-center">{children}</span>
    </button>
  );
};

const ResourceCounters = () => {
  return (
    <div className="flex w-full py-1 mx-auto gap-0.5">
      {(['wood', 'clay', 'iron', 'wheat'] as Resource[]).map((resource: Resource, index) => (
        <Fragment key={resource}>
          <ResourceCounter resource={resource} />
          {index !== 3 && <Divider orientation="vertical" />}
        </Fragment>
      ))}
    </div>
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
      <div className="flex-col hidden lg:flex">
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
        <nav className="flex flex-col w-fit lg:-translate-y-8 max-h-11 pt-1 container mx-auto">
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
                <li>
                  <LinkWithState to={gameNavigation.heroPath}>
                    <HeroNavigationItem />
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
      </div>
      {/* Empty div to bring down the header on mobile devices */}
      <div className="hidden standalone:flex h-12 w-full bg-gray-600" />
      <div className="flex justify-center items-center text-center px-2 lg:hidden h-14 w-full text-sm bg-blue-400">
        Top navigation section, not sure what to put here yet. Post ideas in Discord :)
      </div>
      <div className="relative lg:absolute top-full left-1/2 -translate-x-1/2 bg-white max-w-xl w-full z-20 px-2 shadow-lg border-b border-b-gray-200 lg:border-b-none">
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
    <header className="lg:hidden fixed bottom-0 left-0 pb-8 w-full bg-[linear-gradient(0deg,_rgba(255,255,255,1)_0%,_rgba(232,232,232,1)_83%,_rgba(255,255,255,1)_83.1%,_rgba(255,255,255,1)_86%,_rgba(255,255,255,0)_86.1%,_rgba(255,255,255,0)_100%)]">
      <nav
        ref={container}
        className="flex flex-col w-full overflow-x-scroll scrollbar-hidden"
      >
        <ul className="flex w-fit gap-2 justify-between items-center px-2 pt-4 pb-2 mx-auto">
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
            <ul className="flex gap-2 -translate-y-2 mx-2">
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
              <li>
                <LinkWithState to={gameNavigation.heroPath}>
                  <HeroNavigationItem />
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

export const Fallback = () => {
  return <div>Loader...</div>;
};

const GameLayout = () => {
  const { timeOfDay, skinVariant } = usePreferences();

  return (
    <GameEngineProvider>
      <CurrentResourceProvider>
        <CountdownProvider>
          <div className={clsx(`time-of-day-${timeOfDay}`, `skin-variant-${skinVariant}`)}>
            <TopNavigation />
            <Outlet />
            <MobileBottomNavigation />
          </div>
        </CountdownProvider>
      </CurrentResourceProvider>
    </GameEngineProvider>
  );
};

export default GameLayout;
