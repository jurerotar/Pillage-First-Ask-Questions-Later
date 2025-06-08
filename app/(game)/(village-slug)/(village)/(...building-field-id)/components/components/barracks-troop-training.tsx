import {
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitOverview,
  UnitRecruitment,
  UnitRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useUnits } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-units';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/troop-training-table';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/utils/icon';

export const BarracksTroopTraining = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { getTribeUnitsByCategory } = useUnits();
  const { isUnitResearched } = useUnitResearch();

  const infantryUnits = getTribeUnitsByCategory('infantry');

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Train infantry units')}</Text>
        <Text as="p">
          {t(
            'Select the type and number of infantry units to train. Once queued, units will be trained one at a time, in the order you queued them in.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <TroopTrainingTable buildingId="BARRACKS" />
      </SectionContent>
      <SectionContent>
        <Tabs>
          <TabList>
            {infantryUnits.map(({ id }) => (
              <Tab key={id}>
                <div className="inline-flex items-center gap-2">
                  <Icon
                    type={unitIdToUnitIconMapper(id)}
                    className="size-4"
                  />
                  {assetsT(`UNITS.${id}.NAME`, { count: 1 })}
                </div>
              </Tab>
            ))}
          </TabList>
          {infantryUnits.map(({ id }) => {
            const hasResearchedUnit = isUnitResearched(id);

            return (
              <TabPanel key={id}>
                <UnitCard
                  unitId={id}
                  buildingId="BARRACKS"
                  showOuterBorder={false}
                  durationEffect="barracksTrainingDuration"
                >
                  <UnitOverview />
                  <UnitAttributes />
                  {hasResearchedUnit && (
                    <>
                      <UnitCost />
                      <UnitRecruitment />
                    </>
                  )}
                  {!hasResearchedUnit && <UnitRequirements />}
                </UnitCard>
              </TabPanel>
            );
          })}
        </Tabs>
      </SectionContent>
    </Section>
  );
};
