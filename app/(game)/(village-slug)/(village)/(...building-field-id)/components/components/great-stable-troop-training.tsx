import { useTranslation } from 'react-i18next';
import { useUnits } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-units';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import {
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitOverview,
  UnitRecruitment,
  UnitRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/troop-training-table';

export const GreatStableTroopTraining = () => {
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
            'Select the type and number of infantry units to train. Once queued, units will be trained one at a time, in the order you queued them in.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <TroopTrainingTable buildingId="GREAT_STABLE" />
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
                  buildingId="GREAT_STABLE"
                  showOuterBorder={false}
                  durationEffect="greatStableTrainingDuration"
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
