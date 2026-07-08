import { clsx } from 'clsx';
import { memo } from 'react';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import { EmptyBuildingField } from 'app/(game)/(village-slug)/(village)/components/empty-building-field';
import { OccupiedBuildingField } from 'app/(game)/(village-slug)/(village)/components/occupied-building-field';
import buildingFieldStyles from './building-field.module.scss';

type BuildingFieldProps = {
  buildingField: BuildingFieldType | null;
  buildingFieldId: BuildingFieldType['id'];
};

export const BuildingField = memo(
  ({ buildingField, buildingFieldId }: BuildingFieldProps) => {
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
  },
);
