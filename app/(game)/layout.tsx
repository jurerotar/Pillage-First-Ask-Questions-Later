import { useIsRestoring } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import { useCalculatedResource } from 'app/(game)/hooks/use-calculated-resource';
import { CurrentResourceProvider } from 'app/(game)/providers/current-resources-provider';
import { GameEngineProvider } from 'app/(game)/providers/game-engine-provider';
import { GameStateProvider } from 'app/(game)/providers/game-state-provider';
import { GameLayoutSkeleton } from 'app/(game)/skeleton';
import { Icon } from 'app/components/icon';
import type { Resource } from 'app/interfaces/models/game/resource';
import { formatNumberWithCommas } from 'app/utils/common';
import clsx from 'clsx';
import type React from 'react';
import { Suspense, use } from 'react';
import { GiWheat } from 'react-icons/gi';
import { GrResources } from 'react-icons/gr';
import { LuScrollText } from 'react-icons/lu';
import { MdOutlineHolidayVillage } from 'react-icons/md';
import { RiAuctionLine } from 'react-icons/ri';
import { Await, Link, Outlet } from 'react-router';
import { usePreferences } from 'app/(game)/hooks/use-preferences';
import { ViewportContext } from 'app/providers/viewport-context';
import { Countdown } from 'app/(game)/components/countdown';

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
            <span className="text-xxs font-medium text-white lg:text-sm lg:text-black">
              {formatNumberWithCommas(calculatedResourceAmount)}
            </span>
            <span className="text-xxs hidden font-normal text-white lg:flex lg:text-sm lg:text-black">
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
              className="text-xxs font-medium absolute-centering text-center absolute"
            />
          )}
        </div>
        <div className="flex w-full items-center justify-between lg:hidden">
          <span />
          <span className="text-xxs font-medium text-white">
            {productionSign}
            {hourlyProduction}/h
          </span>
        </div>
      </div>
    </div>
  );
};

const DesktopNavigation = () => {
  const { villagePath, reportsPath, resourcesPath, auctionsPath, currentVillageMapPath } = useGameNavigation();

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
                <Link to={resourcesPath}>
                  <GiWheat className="text-2xl text-white" />
                </Link>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <Link to={villagePath}>
                  <MdOutlineHolidayVillage className="text-2xl text-white" />
                </Link>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <Link to={currentVillageMapPath}>
                  <GrResources className="text-2xl text-white" />
                </Link>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <Link to={reportsPath}>
                  <LuScrollText className="text-2xl text-white" />
                </Link>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <Link to={auctionsPath}>
                  <RiAuctionLine className="text-2xl text-white" />
                </Link>
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

const MobileBottomNavigation = () => {
  const { villagePath, reportsPath, resourcesPath, auctionsPath, currentVillageMapPath } = useGameNavigation();

  return (
    <header className="fixed bottom-0 left-0 flex h-12 w-full justify-between gap-2 bg-gradient-to-t from-[#101010] to-[#484848]">
      <div className="flex flex-1 items-center justify-center">
        <Link to={resourcesPath}>
          <GiWheat className="text-2xl text-white" />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Link to={villagePath}>
          <MdOutlineHolidayVillage className="text-2xl text-white" />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Link to={currentVillageMapPath}>
          <GrResources className="text-2xl text-white" />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Link to={reportsPath}>
          <LuScrollText className="text-2xl text-white" />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Link to={auctionsPath}>
          <RiAuctionLine className="text-2xl text-white" />
        </Link>
      </div>
    </header>
  );
};

const GameSkinWrapper: React.FCWithChildren = ({ children }) => {
  const { timeOfDay, skinVariant } = usePreferences();

  return <div className={clsx(`time-of-day-${timeOfDay}`, `skin-variant-${skinVariant}`)}>{children}</div>;
};

const GameLayout = () => {
  const { isWiderThanMd } = use(ViewportContext);
  const { isMapPageOpen } = useGameNavigation();
  const isRestoring = useIsRestoring();

  const shouldDisplayDesktopNavigation = isWiderThanMd;
  const shouldDisplayMobileResourcesSection = !isWiderThanMd && !isMapPageOpen;
  const shouldDisplayMobileBottomNavigation = !isWiderThanMd;

  return (
    <Suspense fallback={<GameLayoutSkeleton />}>
      <Await resolve={!isRestoring}>
        <GameSkinWrapper>
          {shouldDisplayDesktopNavigation && <DesktopNavigation />}
          {shouldDisplayMobileResourcesSection && <MobileResourcesSection />}
          <Outlet />
          {shouldDisplayMobileBottomNavigation && <MobileBottomNavigation />}
        </GameSkinWrapper>
      </Await>
    </Suspense>
  );
};

export default () => {
  return (
    <GameStateProvider>
      <GameEngineProvider>
        <CurrentResourceProvider>
          <GameLayout />
        </CurrentResourceProvider>
      </GameEngineProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </GameStateProvider>
  );
};
