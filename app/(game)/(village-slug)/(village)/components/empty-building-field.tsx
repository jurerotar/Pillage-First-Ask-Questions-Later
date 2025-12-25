import { Link } from 'react-router';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/building-field';

type EmptyBuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

export const EmptyBuildingField = ({
  buildingFieldId,
}: EmptyBuildingFieldProps) => {
  return (
    <Link
      to={`${buildingFieldId}`}
      tabIndex={0}
      data-building-field-id={buildingFieldId}
      className="w-12 lg:w-20 h-8 lg:h-12 bg-green-900/50 hover:bg-green-800/70 transition-colors duration-150 focus:ring-2 focus:ring-black/80 cursor-pointer"
      style={{
        clipPath: 'ellipse(50% 50% at 50% 50%)',
      }}
    />
  );
};
