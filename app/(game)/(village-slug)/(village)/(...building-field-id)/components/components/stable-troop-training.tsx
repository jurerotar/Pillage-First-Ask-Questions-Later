import { useTranslation } from 'react-i18next';
import { useUnits } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-units';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import {
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitLevel,
  UnitOverview,
  UnitRecruitment,
  UnitRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/troop-training-table';

export const StableTroopTraining = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { getTribeUnitsByCategory } = useUnits();
  const { isUnitResearched } = useUnitResearch();

  const cavalryUnits = getTribeUnitsByCategory('cavalry');

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Train cavalry units')}</Text>
        <Text as="p">
          {t(
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam consequuntur corporis ducimus esse iste itaque laudantium minima modi molestiae molestias nam pariatur perspiciatis placeat praesentium quaerat rerum sit, ullam vitae!',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <TroopTrainingTable buildingId="STABLE" />
      </SectionContent>
      <SectionContent>
        <Tabs>
          <TabList>
            {cavalryUnits.map(({ id }) => (
              <Tab key={id}>{assetsT(`UNITS.${id}.NAME`, { count: 1 })}</Tab>
            ))}
          </TabList>
          {cavalryUnits.map(({ id }) => {
            const hasResearchedUnit = isUnitResearched(id);

            return (
              <TabPanel key={id}>
                <UnitCard
                  unitId={id}
                  buildingId="STABLE"
                  showOuterBorder={false}
                  durationEffect="stableTrainingDuration"
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
