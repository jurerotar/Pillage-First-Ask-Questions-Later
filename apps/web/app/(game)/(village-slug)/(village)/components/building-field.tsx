import { clsx } from 'clsx';
import { getBuildingFieldByBuildingFieldId } from '@pillage-first/game-assets/buildings/utils';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import { EmptyBuildingField } from 'app/(game)/(village-slug)/(village)/components/empty-building-field';
import { OccupiedBuildingField } from 'app/(game)/(village-slug)/(village)/components/occupied-building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import buildingFieldStyles from './building-field.module.scss';

type BuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

export const BuildingField = ({ buildingFieldId }: BuildingFieldProps) => {
  const { currentVillage } = useCurrentVillage();

  const buildingField = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
  );

  const positioningStyles =
    buildingFieldStyles[`building-field--${buildingFieldId}`];

  return (
    <div
      className={clsx(
        positioningStyles,
        'absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center',
      )}
    >
      {buildingField === null ? (
        <EmptyBuildingField buildingFieldId={buildingFieldId} />
      ) : (
        <OccupiedBuildingField buildingField={buildingField} />
      )}
    </div>
  );
};
