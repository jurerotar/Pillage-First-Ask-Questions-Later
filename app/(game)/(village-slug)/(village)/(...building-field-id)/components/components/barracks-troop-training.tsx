import {
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitLevel,
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
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam consequuntur corporis ducimus esse iste itaque laudantium minima modi molestiae molestias nam pariatur perspiciatis placeat praesentium quaerat rerum sit, ullam vitae!',
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
              <Tab key={id}>{assetsT(`UNITS.${id}.NAME`, { count: 1 })}</Tab>
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
                  <UnitLevel />
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
