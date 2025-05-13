import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerTroops } from 'app/(game)/(village-slug)/hooks/use-player-troops';
import { FaShield } from 'react-icons/fa6';

export const TroopList = () => {
  const { shouldShowSidebars } = useGameLayoutState();
  const { currentVillage } = useCurrentVillage();
  const { playerTroops } = usePlayerTroops();

  if (!shouldShowSidebars) {
    return null;
  }

  const currentVillagePlayerTroops = playerTroops.filter(({ tileId }) => tileId === currentVillage.id);

  if (currentVillagePlayerTroops.length === 0) {
    return null;
  }

  const sortedTroops = currentVillagePlayerTroops.sort((a, b) => {
    const aSame = a.tileId === a.source ? 0 : 1;
    const bSame = b.tileId === b.source ? 0 : 1;
    return aSame - bSame;
  });

  return (
    <div className="flex flex-col absolute right-4 top-27 lg:top-40 gap-2">
      <details>
        <summary>Expand</summary>
        <ul className="flex flex-col gap-2">
          {sortedTroops.map((troop) => (
            <li
              className="flex gap-1"
              key={troop.unitId}
            >
              {troop.tileId !== troop.source && <FaShield className="text-green-700" />}
              {troop.amount} {troop.unitId}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};
