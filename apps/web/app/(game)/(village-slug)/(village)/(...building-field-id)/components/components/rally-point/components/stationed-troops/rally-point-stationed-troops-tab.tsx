import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
import { partition } from '@pillage-first/utils/array';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { InformationPopover } from 'app/(game)/components/information-popover';
import {
  UnitTable,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
  UnitTableWheatConsumption,
} from 'app/(game)/components/unit-table';
import { Text } from 'app/components/text';

export const RallyPointStationedTroopsTab = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();
  const { villageTroops } = useVillageTroops();

  const [ownTroops] = useMemo(() => {
    return partition(
      villageTroops,
      (troop) => troop.source === currentVillage.tileId,
    );
  }, [villageTroops, currentVillage.tileId]);

  const sortedTroops = useMemo(() => {
    return sortTroops(tribe, ownTroops);
  }, [tribe, ownTroops]);

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Stationed troops')}>
          <Text>
            {t(
              'These are the troops currently stationed in this village and available as part of your local garrison.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Stationed troops')}</Text>
      </SectionContent>
      <SectionContent>
        <UnitTable tribe={tribe}>
          <UnitTableTitle>{t('Your troops')}</UnitTableTitle>
          <UnitTableUnitIcons />
          <UnitTableRow
            label={t('Troops')}
            troops={sortedTroops}
          />
          <UnitTableWheatConsumption troops={sortedTroops} />
        </UnitTable>
      </SectionContent>
    </Section>
  );
};
