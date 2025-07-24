import type { Building } from 'app/interfaces/models/game/building';
import type React from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';

const availableBuildingFieldIdSlots = [...new Array(40).keys()].map(
  (num) => num + 1,
);
const availableBuildingFieldIdSlotsSet = new Set(availableBuildingFieldIdSlots);

type VillageBuildingLinkProps = {
  buildingId: Building['id'];
};

export const VillageBuildingLink: React.FC<VillageBuildingLinkProps> = ({
  buildingId,
}) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { resourcesPath, villagePath } = useGameNavigation();
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
        <Link
          to={`${matchingBuildingField.id <= 18 ? resourcesPath : villagePath}/${matchingBuildingField.id}`}
        >
          {buildingName}
        </Link>
      </Text>
    );
  }

  const occupiedBuildingFieldIds = buildingFields.map(({ id }) => id);
  const occupiedBuildingFieldIdsSet = new Set(occupiedBuildingFieldIds);
  const emptySlots = availableBuildingFieldIdSlotsSet.difference(
    occupiedBuildingFieldIdsSet,
  );
  const firstEmptySlotId: number | undefined = Math.min(...emptySlots.values());

  if (firstEmptySlotId) {
    return (
      <Text
        as="span"
        data-tooltip-id="general-tooltip"
        data-tooltip-content={t(
          '{{buildingName}} does not exist in this village, first empty building slot will be opened instead',
          { buildingName },
        )}
        variant="link"
      >
        <Link
          to={`${firstEmptySlotId <= 18 ? resourcesPath : villagePath}/${firstEmptySlotId}`}
        >
          {buildingName}
        </Link>
      </Text>
    );
  }

  return (
    <Text
      as="span"
      data-tooltip-id="general-tooltip"
      data-tooltip-content={t(
        "Building does not exist and there's no available building spots",
      )}
    >
      {buildingName}
    </Text>
  );
};
