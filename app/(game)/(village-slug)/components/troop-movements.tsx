import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import clsx from 'clsx';

export const TroopMovements = () => {
  const { shouldShowSidebars } = useGameLayoutState();
  return <div className={clsx('', shouldShowSidebars ? 'flex' : 'hidden')} />;
};
