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

export const BarracksTroopTraining = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { getTribeUnitsByCategory } = useUnits();
  const { isUnitResearched } = useUnitResearch();

  const infantryUnits = getTribeUnitsByCategory('infantry');

  return (
    <article className="flex flex-col gap-2">
      <Text as="h2">{t('Train infantry units')}</Text>
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
    </article>
  );
};
