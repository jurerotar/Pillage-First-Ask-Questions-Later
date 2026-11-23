import type { VillageOption } from '../utils/villages';

type VillageLabelProps = {
  village: VillageOption;
};

export const VillageLabel = ({ village }: VillageLabelProps) => {
  return (
    <span>
      {village.name} ({village.coordinates.x}|{village.coordinates.y})
    </span>
  );
};
