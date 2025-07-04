import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';
import type React from 'react';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Link } from 'react-router';
import clsx from 'clsx';

type EmptyBuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

export const EmptyBuildingField: React.FC<EmptyBuildingFieldProps> = ({
  buildingFieldId,
}) => {
  const { villagePath } = useGameNavigation();

  return (
    <Link
      to={`${villagePath}/${buildingFieldId}`}
      tabIndex={0}
      className={clsx(
        'absolute flex size-10 md:size-16 items-center justify-center rounded-full',
        'bg-green-900/50 transition-colors duration-150 -translate-x-1/2 -translate-y-1/2',
        'hover:bg-green-800/70 ring-2 ring-transparent hover:ring-black/60 ',
        'transform rotate-140 skew-x-20',
      )}
      data-building-field-id={buildingFieldId}
    />
  );
};
