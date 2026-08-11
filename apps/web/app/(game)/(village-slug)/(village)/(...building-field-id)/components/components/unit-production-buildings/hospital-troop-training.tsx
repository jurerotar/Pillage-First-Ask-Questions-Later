import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type { TroopTrainingBuildingId } from '@pillage-first/types/models/building';
import { isAsclepeion } from '@pillage-first/utils/guards/building';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  UnitAttributes,
  UnitCard,
  UnitHealing,
  UnitHealingCost,
  UnitOverview,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/unit-production-buildings/components/unit-card';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/components/troop-training-table';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { useWoundedTroops } from 'app/(game)/(village-slug)/hooks/use-wounded-troops';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';

export const HospitalTroopTraining = () => {
  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const { woundedTroops } = useWoundedTroops();
  const { isUnitResearched } = useUnitResearch();

  const buildingId = buildingField!.buildingId as TroopTrainingBuildingId;
  const woundedRecoveryRate = isAsclepeion(buildingId) ? 60 : 40;
  const researchedWoundedTroops = woundedTroops.filter(({ unitId }) => {
    return isUnitResearched(unitId);
  });

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="train" />
        <InformationPopover ariaLabel={t('Heal units')}>
          <div className="flex flex-col gap-2">
            <Text>
              {t(
                '{{buildingName}} saves {{rate}}% of eligible battle losses as wounded troops. Siege engines, settlers, administrators, and heroes cannot become wounded.',
                {
                  buildingName: t(`BUILDINGS.${buildingId}.NAME`),
                  rate: woundedRecoveryRate,
                },
              )}
            </Text>
            <Text>
              {t(
                'Queued healing uses one shared queue for infantry and cavalry. Wounded troops that are not queued continue decaying by 10% per day and do not consume crop.',
              )}
            </Text>
          </div>
        </InformationPopover>
        <Text as="h2">{t('Heal wounded troops')}</Text>
      </SectionContent>
      <TroopTrainingTable buildingId={buildingId} />
      <SectionContent>
        {researchedWoundedTroops.length === 0 && (
          <>
            <Text as="h3">{t('Wounded troops')}</Text>
            <Text>{t('No wounded troops are available for healing.')}</Text>
          </>
        )}
        {researchedWoundedTroops.length > 0 &&
          researchedWoundedTroops.map(({ unitId, amount }) => (
            <div
              key={unitId}
              className="p-2 border border-border"
            >
              <UnitCard unitId={unitId}>
                <UnitOverview />
                <UnitAttributes />
                <UnitHealingCost />
                <UnitHealing woundedAmount={amount} />
              </UnitCard>
            </div>
          ))}
      </SectionContent>
    </Section>
  );
};
