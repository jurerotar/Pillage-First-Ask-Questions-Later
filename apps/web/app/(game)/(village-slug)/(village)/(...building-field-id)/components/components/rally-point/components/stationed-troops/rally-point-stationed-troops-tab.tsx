import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { partition } from '@pillage-first/utils/array';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops.ts';
import {
  UnitTable,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
  UnitTableWheatConsumption,
} from 'app/(game)/components/unit-table';
import { Text } from 'app/components/text';
import { formatTroopAmount } from '../../utils/format-troop-amount.ts';

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

  const ownTroopsAmount = useMemo(() => {
    return formatTroopAmount(tribe, ownTroops);
  }, [tribe, ownTroops]);

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Stationed troops')}</Text>
        <Text>
          {t(
            'These are the troops currently stationed in this village and available as part of your local garrison.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <UnitTable tribe={tribe}>
          <UnitTableTitle>{t('Your troops')}</UnitTableTitle>
          <UnitTableUnitIcons />
          <UnitTableRow
            label={t('Troops')}
            amount={ownTroopsAmount}
          />
          <UnitTableWheatConsumption amount={ownTroopsAmount} />
        </UnitTable>
      </SectionContent>
    </Section>
  );
};
