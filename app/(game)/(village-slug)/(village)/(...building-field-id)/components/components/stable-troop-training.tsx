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

export const StableTroopTraining = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { getTribeUnitsByCategory } = useUnits();
  const { isUnitResearched } = useUnitResearch();

  const cavalryUnits = getTribeUnitsByCategory('cavalry');

  return (
    <article className="flex flex-col gap-2">
      <Text as="h2">{t('Train cavalry units')}</Text>
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
                showOuterBorder={false}
                durationEffect="stableTrainingDuration"
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
    </article>
  );
};
