import {
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitOverview,
  UnitRecruitment,
  UnitRecruitmentNoResearch,
  UnitRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-card';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useUnits } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-units';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/components/troop-training-table';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import type { TroopTrainingBuildingId } from 'app/interfaces/models/game/building';
import type { TroopTrainingDurationEffectId } from 'app/interfaces/models/game/effect';
import type { Unit } from 'app/interfaces/models/game/unit';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';

const buildingIdToTroopTrainingEffectAndCategoryMap = new Map<
  TroopTrainingBuildingId,
  [TroopTrainingDurationEffectId, Unit['category']]
>([
  ['BARRACKS', ['barracksTrainingDuration', 'infantry']],
  ['STABLE', ['stableTrainingDuration', 'cavalry']],
  ['WORKSHOP', ['workshopTrainingDuration', 'siege']],
  ['GREAT_BARRACKS', ['greatBarracksTrainingDuration', 'infantry']],
  ['GREAT_STABLE', ['greatStableTrainingDuration', 'cavalry']],
]);

type UnitTrainingProps = {
  // This can be extracted from BuildingContext, but we'd need some type narrowing
  buildingId: TroopTrainingBuildingId;
};

export const UnitTraining = ({ buildingId }: UnitTrainingProps) => {
  const { t, t: assetsT } = useTranslation();
  const { getTribeUnitsByCategory } = useUnits();
  const { isUnitResearched } = useUnitResearch();

  const [durationEffect, category] =
    buildingIdToTroopTrainingEffectAndCategoryMap.get(buildingId)!;

  const units = getTribeUnitsByCategory(category);

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="train" />
        <Text as="h2">{t('Train units')}</Text>
        <Text>
          {t(
            'Select the type and number of units to train. Once queued, units will be trained one at a time, in the order you queued them in.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <TroopTrainingTable buildingId={buildingId} />
      </SectionContent>
      <SectionContent>
        <Tabs>
          <TabList>
            {units.map(({ id }) => (
              <Tab key={id}>
                <div className="inline-flex items-center gap-2">
                  <Icon
                    type={unitIdToUnitIconMapper(id)}
                    className="size-4"
                  />
                  {assetsT(`UNITS.${id}.NAME`)}
                </div>
              </Tab>
            ))}
          </TabList>
          {units.map(({ id }) => {
            const hasResearchedUnit = isUnitResearched(id);

            return (
              <TabPanel key={id}>
                <UnitCard
                  unitId={id}
                  buildingId={buildingId}
                  showOuterBorder={false}
                  durationEffect={durationEffect}
                >
                  <UnitOverview />
                  <UnitAttributes />
                  {hasResearchedUnit && (
                    <>
                      <UnitCost />
                      <UnitRecruitment />
                    </>
                  )}
                  {!hasResearchedUnit && (
                    <>
                      <UnitRequirements />
                      <UnitRecruitmentNoResearch />
                    </>
                  )}
                </UnitCard>
              </TabPanel>
            );
          })}
        </Tabs>
      </SectionContent>
    </Section>
  );
};
