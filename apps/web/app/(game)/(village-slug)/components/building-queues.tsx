import { Suspense } from 'react';
import { ConstructionQueue } from 'app/(game)/(village-slug)/components/construction-queue';
import { DemolitionQueue } from 'app/(game)/(village-slug)/components/demolition-queue';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';

export const BuildingQueues = () => {
  const { shouldShowSidebars } = useGameLayoutState();

  if (!shouldShowSidebars) {
    return null;
  }

  return (
    <aside className="fixed left-0 bottom-26 lg:bottom-14 z-20 flex flex-col gap-1 transition-all">
      <Suspense fallback={null}>
        <DemolitionQueue />
        <ConstructionQueue />
      </Suspense>
    </aside>
  );
};
