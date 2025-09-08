import type { Building } from 'app/interfaces/models/game/building';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { BuildingField } from 'app/interfaces/models/game/building-field';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';

type VillageBuildingLinkProps = {
  buildingId: Building['id'];
};

export const VillageBuildingLink = ({
  buildingId,
}: VillageBuildingLinkProps) => {
  const { t } = useTranslation();
  const assetsT = t;
  const { currentVillage } = useCurrentVillage();
  const buildingFields = currentVillage.buildingFields;

  const buildingName = assetsT(`BUILDINGS.${buildingId}.NAME`);

  const matchingBuildingField: BuildingField | undefined = buildingFields.find(
    (buildingField) => buildingField.buildingId === buildingId,
  );

  if (matchingBuildingField) {
    return (
      <Text
        as="span"
        variant="link"
      >
        <Link to={`${matchingBuildingField.id}`}>{buildingName}</Link>
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
};
