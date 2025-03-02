import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import { useCalculatedResource } from 'app/(game)/hooks/use-calculated-resource';
import { CurrentResourceProvider } from 'app/(game)/providers/current-resources-provider';
import { GameEngineProvider } from 'app/(game)/providers/game-engine-provider';
import { GameStateProvider } from 'app/(game)/providers/game-state-provider';
import { Icon } from 'app/components/icon';
import type { Resource } from 'app/interfaces/models/game/resource';
import { formatNumberWithCommas } from 'app/utils/common';
import clsx from 'clsx';
import type React from 'react';
import { use, useRef } from 'react';
import { GiWheat } from 'react-icons/gi';
import { LuScrollText } from 'react-icons/lu';
import { MdOutlineHolidayVillage, MdSettings } from 'react-icons/md';
import { RiAuctionLine } from 'react-icons/ri';
import { Countdown } from 'app/(game)/components/countdown';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { ViewportContext } from 'app/providers/viewport-context';
import { usePreferences } from 'app/(game)/hooks/use-preferences';
import { IoExitOutline } from 'react-icons/io5';
import { FaBookBookmark, FaUser } from 'react-icons/fa6';
import { GoGraph } from 'react-icons/go';
import { PiPathBold } from 'react-icons/pi';
import { TbMap2 } from 'react-icons/tb';
import { useCenterHorizontally } from 'app/(game)/hooks/dom/use-center-horizontally';
import { LinkWithState } from 'app/components/link-with-state';
import { Outlet } from 'react-router';

type ResourceCounterProps = {
  resource: Resource;
};

const ResourceCounter: React.FC<ResourceCounterProps> = ({ resource }) => {
  const { calculatedResourceAmount, hourlyProduction, storageCapacity, isFull, hasNegativeProduction, resourceDepletionOrFullAt } =
    useCalculatedResource(resource);

  const storagePercentage = (calculatedResourceAmount / storageCapacity) * 100;
  const productionSign = hasNegativeProduction ? '-' : '+';

  return (
    <div className="flex w-full items-center gap-2 lg:rounded-md lg:border-2 lg:border-stone-400 lg:bg-stone-100 lg:px-1 lg:pb-1">
      <Icon
        className="hidden size-5 lg:flex"
        type={resource}
      />
      <div className="flex w-full flex-col">
        <div className="flex w-full items-center justify-between lg:justify-end">
          <Icon
            className="size-4 lg:hidden"
            type={resource}
          />
          <div className="flex">
            <span className="text-2xs font-medium text-white lg:text-sm lg:text-black">
              {formatNumberWithCommas(calculatedResourceAmount)}
            </span>
            <span className="text-2xs hidden font-normal text-white lg:flex lg:text-sm lg:text-black">
              /{formatNumberWithCommas(storageCapacity)}
            </span>
          </div>
        </div>
        <div className="relative mt-px flex h-3 w-full bg-white lg:h-3 shadow-inner">
          <div
            className={clsx(isFull || hasNegativeProduction ? 'bg-red-600' : 'bg-green-500', 'flex h-full')}
            style={{
              width: `${storagePercentage}%`,
            }}
          />
          {resourceDepletionOrFullAt !== null && (
            <Countdown
              endsAt={resourceDepletionOrFullAt}
              className="text-2xs font-medium absolute-centering text-center absolute"
            />
          )}
        </div>
        <div className="flex w-full items-center justify-between lg:hidden">
          <span />
          <span className="text-2xs font-medium text-white">
            {productionSign}
            {hourlyProduction}/h
          </span>
        </div>
      </div>
    </div>
  );
};

const DesktopNavigation = () => {
  const { villagePath, reportsPath, resourcesPath, auctionsPath, mapPath } = useGameNavigation();
  const {
    currentVillage: { coordinates },
  } = useCurrentVillage();

  const currentVillageMapPath = `${mapPath}?x=${coordinates.x}&y=${coordinates.y}`;

  return (
    <header className="fixed left-0 top-0 z-10 flex h-24 w-full">
      <div className="absolute z-[-1] h-10 w-full bg-gradient-to-r from-[#F4F4F4] via-[#8E8E8E] to-[#F4F4F4]" />
      <div className="container mx-auto flex justify-between">
        <div className="flex flex-1" />
        <div className="flex flex-1 bg-[#A59380]">
          <div className="w-30 flex h-24 border border-red-500 items-center text-center">Hero placeholder</div>
          <div className="flex w-full flex-col p-2">
            <div className="flex w-full flex-[2] justify-between">
              <div className="flex flex-1 items-center justify-center">
                <LinkWithState to={resourcesPath}>
                  <GiWheat className="text-2xl text-white" />
                </LinkWithState>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <LinkWithState to={villagePath}>
                  <MdOutlineHolidayVillage className="text-2xl text-white" />
                </LinkWithState>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <LinkWithState to={currentVillageMapPath}>
                  <TbMap2 className="text-2xl text-white" />
                </LinkWithState>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <LinkWithState to={reportsPath}>
                  <LuScrollText className="text-2xl text-white" />
                </LinkWithState>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <LinkWithState to={auctionsPath}>
                  <RiAuctionLine className="text-2xl text-white" />
                </LinkWithState>
              </div>
            </div>
            <div className="flex flex-1 gap-1">
              {(['wood', 'clay', 'iron', 'wheat'] as Resource[]).map((resource: Resource) => (
                <div
                  key={resource}
                  className="flex flex-1"
                >
                  <ResourceCounter resource={resource} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-1" />
      </div>
    </header>
  );
};

const MobileResourcesSection = () => {
  return (
    <div className="flex w-full bg-gradient-to-b from-[#101010] to-[#484848] p-1">
      {(['wood', 'clay', 'iron', 'wheat'] as Resource[]).map((resource: Resource, index) => (
        <div
          key={resource}
          className={clsx(index !== 3 && 'border-r border-gray-600', 'flex flex-1  px-1')}
        >
          <ResourceCounter resource={resource} />
        </div>
      ))}
    </div>
  );
};

type MobileNavigationMainItem = React.ButtonHTMLAttributes<HTMLButtonElement> & {};

const MobileNavigationMainItem: React.FCWithChildren<MobileNavigationMainItem> = ({ children, ...rest }) => {
  return (
    <button
      type="button"
      className="size-12 bg-white border-4 border-gray-400 rounded-full flex items-center justify-center shadow"
      {...rest}
    >
      {children}
    </button>
  );
};

type MobileNavigationSideItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {};

const MobileNavigationSideItem: React.FCWithChildren<MobileNavigationSideItemProps> = ({ children, ...rest }) => {
  return (
    <button
      type="button"
      className="px-2.5 py-1.5 bg-white border border-gray-400 rounded-xs flex items-center justify-center shadow-md"
      {...rest}
    >
      {children}
    </button>
  );
};

const MobileBottomNavigation = () => {
  const {
    villagePath,
    reportsPath,
    resourcesPath,
    auctionsPath,
    mapPath,
    adventuresPath,
    heroPath,
    statisticsPath,
    questsPath,
    preferencesPath,
  } = useGameNavigation();
  const {
    currentVillage: { coordinates },
  } = useCurrentVillage();

  const container = useRef<HTMLDivElement>(null);

  const currentVillageMapPath = `${mapPath}?x=${coordinates.x}&y=${coordinates.y}`;

  useCenterHorizontally(container);

  // This is literally the hackiest html I've ever written. Basically, fixed header, overflow-x & translate-y do not work together at all.
  // There's always either non-working scroll or elements being cut. The way it works now is that technically, nothing is overflowing with translate,
  // we just have a transparent container and some very hacky gradient to make it look like it works
  return (
    <header className="fixed bottom-0 left-0 pb-10 w-full bg-[linear-gradient(0deg,_rgba(255,255,255,1)_0%,_rgba(255,255,255,1)_88%,_rgba(0,0,0,0)_88.1%,_rgba(0,0,0,0)_100%)]">
      <div
        ref={container}
        className="flex flex-col w-full overflow-x-scroll scrollbar-hidden"
      >
        <div className="flex w-fit gap-2 justify-between items-center px-2 pt-3">
          <LinkWithState to={statisticsPath}>
            <MobileNavigationSideItem>
              <GoGraph className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
          <LinkWithState to={auctionsPath}>
            <MobileNavigationSideItem>
              <RiAuctionLine className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
          <LinkWithState to={adventuresPath}>
            <MobileNavigationSideItem>
              <PiPathBold className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
          <LinkWithState to={heroPath}>
            <MobileNavigationSideItem>
              <FaUser className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
          <div className="flex gap-2 -translate-y-2">
            <LinkWithState to={resourcesPath}>
              <MobileNavigationMainItem>
                <GiWheat className="text-2xl" />
              </MobileNavigationMainItem>
            </LinkWithState>
            <LinkWithState to={villagePath}>
              <MobileNavigationMainItem>
                <MdOutlineHolidayVillage className="text-2xl" />
              </MobileNavigationMainItem>
            </LinkWithState>
            <LinkWithState to={currentVillageMapPath}>
              <MobileNavigationMainItem>
                <TbMap2 className="text-2xl" />
              </MobileNavigationMainItem>
            </LinkWithState>
          </div>
          <LinkWithState to={reportsPath}>
            <MobileNavigationSideItem>
              <LuScrollText className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
          <LinkWithState to={questsPath}>
            <MobileNavigationSideItem>
              <FaBookBookmark className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
          <LinkWithState to={preferencesPath}>
            <MobileNavigationSideItem>
              <MdSettings className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
          <LinkWithState to="/">
            <MobileNavigationSideItem>
              <IoExitOutline className="text-xl" />
            </MobileNavigationSideItem>
          </LinkWithState>
        </div>
      </div>
    </header>
  );
};

export const Fallback = () => {
  return <div>Loader...</div>;
};

const GameLayout = () => {
  const { isWiderThanMd } = use(ViewportContext);
  const { isMapPageOpen } = useGameNavigation();
  const { timeOfDay, skinVariant } = usePreferences();

  const shouldDisplayDesktopNavigation = isWiderThanMd;
  const shouldDisplayMobileResourcesSection = !isWiderThanMd && !isMapPageOpen;
  const shouldDisplayMobileBottomNavigation = !isWiderThanMd;

  return (
    <GameEngineProvider>
      <CurrentResourceProvider>
        <div className={clsx(`time-of-day-${timeOfDay}`, `skin-variant-${skinVariant}`)}>
          {shouldDisplayDesktopNavigation && <DesktopNavigation />}
          {shouldDisplayMobileResourcesSection && <MobileResourcesSection />}
          <Outlet />
          {shouldDisplayMobileBottomNavigation && <MobileBottomNavigation />}
        </div>
      </CurrentResourceProvider>
    </GameEngineProvider>
  );
};

export default () => {
  return (
    <GameStateProvider>
      <GameLayout />
    </GameStateProvider>
  );
};
