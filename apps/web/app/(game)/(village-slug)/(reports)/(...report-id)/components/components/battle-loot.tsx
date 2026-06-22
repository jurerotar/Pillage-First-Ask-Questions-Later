import type { Loot } from '@pillage-first/types/models/battle';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { Icon } from 'app/components/icon';

type BattleLootProps = {
  loot: Loot;
  totalCarryCapacity: number;
};

export const BattleLoot = ({ loot, totalCarryCapacity }: BattleLootProps) => {
  let totalLoot = 0;
  for (const resource of loot) {
    totalLoot += resource;
  }

  return (
    <div className="flex items-center gap-3 ml-2 sm:ml-3 mb-2 sm:mb-4">
      Loot:
      <Resources resources={loot} />
      <div className="flex items-center whitespace-nowrap gap-2">
        (
        <Icon
          className="size-5"
          type="unitCarryCapacity"
        />
        {totalLoot} / {totalCarryCapacity}
      </div>
      )
    </div>
  );
};
