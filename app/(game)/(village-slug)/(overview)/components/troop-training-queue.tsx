import type { TroopTrainingBuildingId } from 'app/interfaces/models/game/building';
import type { PropsWithChildren } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/components/troop-training-table';

type TroopTrainingQueueProps = {
  buildingId: TroopTrainingBuildingId;
};

export const TroopTrainingQueue = ({
  buildingId,
}: PropsWithChildren<TroopTrainingQueueProps>) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();

  const doesBuildingExists = currentVillage.buildingFields.some(
    ({ buildingId: id }) => buildingId === id,
  );

  const buildingName = t(`BUILDINGS.${buildingId}.NAME`);

  return (
    <SectionContent>
      <Text as="h3">{buildingName}</Text>
      {!doesBuildingExists &&
        t(
          'You need to build the {{buildingName}} before you can train troops.',
          { buildingName },
        )}
      {doesBuildingExists && <TroopTrainingTable buildingId={buildingId} />}
    </SectionContent>
  );
};
