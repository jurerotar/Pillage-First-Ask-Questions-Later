import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Text } from 'app/components/text';

type VillageBuildingLinkProps = {
  buildingId: Building['id'];
};

export const VillageBuildingLink = memo(
  ({ buildingId }: VillageBuildingLinkProps) => {
    const { t } = useTranslation();
    const { currentVillage } = useCurrentVillage();
    const { buildingFields } = currentVillage;

    const buildingName = t(`BUILDINGS.${buildingId}.NAME`);

    const matchingBuildingField = useMemo<BuildingField | undefined>(() => {
      return buildingFields.find(
        (buildingField) => buildingField.buildingId === buildingId,
      );
    }, [buildingFields, buildingId]);

    if (matchingBuildingField) {
      return (
        <Text
          as="span"
          variant="link"
        >
          <Link
            relative="path"
            to={`../${matchingBuildingField.id}`}
          >
            {buildingName}
          </Link>
        </Text>
      );
    }

    return (
      <Text
        as="span"
        className="font-semibold"
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t(
          '{{buildingName}} does not yet exist in this village',
          { buildingName },
        )}
      >
        {buildingName}
      </Text>
    );
  },
);
