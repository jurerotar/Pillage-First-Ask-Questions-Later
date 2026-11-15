import type { VillageOption } from '../utils/villages';

export const VillageLabel = ({ village }: { village: VillageOption }) => {
  return (
    <>
      {village.name} ({village.coordinates.x}|{village.coordinates.y})
    </>
  );
};
