import { memo, type PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TroopTrainingBuildingId } from '@pillage-first/types/models/building';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/components/troop-training-table';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Text } from 'app/components/text';

type TroopTrainingQueueProps = {
  buildingId: TroopTrainingBuildingId;
};

export const TroopTrainingQueue = memo(
  ({ buildingId }: PropsWithChildren<TroopTrainingQueueProps>) => {
    const { t } = useTranslation();
    const { currentVillage } = useCurrentVillage();

    const doesBuildingExists = useMemo(() => {
      return currentVillage.buildingFields.some(
        ({ buildingId: id }) => buildingId === id,
      );
    }, [currentVillage.buildingFields, buildingId]);

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
  },
);
