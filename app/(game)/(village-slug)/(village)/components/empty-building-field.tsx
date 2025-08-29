import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/building-field';
import type React from 'react';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Link } from 'react-router';

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
      data-building-field-id={buildingFieldId}
      className="w-12 lg:w-20 h-8 lg:h-12 bg-green-900/50 hover:bg-green-800/70 transition-colors duration-150 focus:ring-2 focus:ring-black/80 cursor-pointer"
      style={{
        clipPath: 'ellipse(50% 50% at 50% 50%)',
      }}
    />
  );
};
