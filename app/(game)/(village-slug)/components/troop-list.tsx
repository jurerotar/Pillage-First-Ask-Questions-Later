import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerTroops } from 'app/(game)/(village-slug)/hooks/use-player-troops';
import { partition } from 'app/utils/common';
import type { Troop } from 'app/interfaces/models/game/troop';

export const TroopList = () => {
  const { shouldShowSidebars } = useGameLayoutState();
  const { currentVillage } = useCurrentVillage();
  const { playerTroops } = usePlayerTroops();

  if (!shouldShowSidebars) {
    return null;
  }

  const currentVillagePlayerTroops = playerTroops.filter(({ tileId }) => tileId === currentVillage.id);

  const [ownUnits, reinforcements] = partition<Troop>(currentVillagePlayerTroops, ({ source }) => source === currentVillage.id);

  if (ownUnits.length === 0 && reinforcements.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col absolute right-4 top-27 lg:top-40 gap-2">
      {ownUnits.length > 0 && (
        <ul className="flex flex-col gap-2">
          {ownUnits.map((troop) => (
            <li key={troop.unitId}>
              {troop.amount} {troop.unitId}
            </li>
          ))}
        </ul>
      )}
      {reinforcements.length > 0 && (
        <ul className="flex flex-col gap-2">
          {reinforcements.map((troop) => (
            <li key={troop.unitId}>
              {troop.amount} {troop.unitId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
