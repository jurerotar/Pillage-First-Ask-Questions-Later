import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TroopTrainingBuildingId } from '@pillage-first/types/models/building';
import type { TroopTrainingDurationEffectId } from '@pillage-first/types/models/effect';
import type { Unit } from '@pillage-first/types/models/unit';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { useUnits } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-units';
import {
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitOverview,
  UnitRecruitment,
  UnitRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/unit-production-buildings/components/unit-card';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/components/troop-training-table';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param.ts';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const buildingIdToTroopTrainingEffectAndCategoryMap = new Map<
  TroopTrainingBuildingId,
  [TroopTrainingDurationEffectId, Unit['category']]
>([
  ['BARRACKS', ['barracksTrainingDuration', 'infantry']],
  ['STABLE', ['stableTrainingDuration', 'cavalry']],
  ['WORKSHOP', ['workshopTrainingDuration', 'siege']],
  ['GREAT_BARRACKS', ['greatBarracksTrainingDuration', 'infantry']],
  ['GREAT_STABLE', ['greatStableTrainingDuration', 'cavalry']],
  ['RESIDENCE', ['residenceTrainingDuration', 'administration']],
]);

type UnitTrainingProps = {
  // This can be extracted from BuildingContext, but we'd need some type narrowing
  buildingId: TroopTrainingBuildingId;
};

export const UnitTraining = ({ buildingId }: UnitTrainingProps) => {
  const { t } = useTranslation();
  const { getTribeUnitsByCategory } = useUnits();

  const [durationEffect, category] =
    buildingIdToTroopTrainingEffectAndCategoryMap.get(buildingId)!;

  const units = getTribeUnitsByCategory(category);
  const tabs = useMemo(() => units.map((unit) => unit.id), [units]);
  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    `${buildingId.toLowerCase()}-unit-training-tab`,
    tabs[0],
  );

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
      <TroopTrainingTable buildingId={buildingId} />
      <Tabs
        value={tabs[tabIndex] ?? tabs[0]}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          {units.map(({ id }) => (
            <Tab
              key={id}
              value={id}
            >
              <div className="inline-flex items-center gap-2">
                <Icon
                  type={unitIdToUnitIconMapper(id)}
                  className="size-4"
                />
                {t(`UNITS.${id}.NAME`)}
              </div>
            </Tab>
          ))}
        </TabList>
        {units.map(({ id }) => (
          <TabPanel
            key={id}
            value={id}
          >
            <UnitCard
              unitId={id}
              buildingId={buildingId}
              showOuterBorder={false}
              durationEffect={durationEffect}
            >
              <UnitOverview />
              <UnitAttributes />
              <UnitCost />
              <UnitRequirements />
              <UnitRecruitment />
            </UnitCard>
          </TabPanel>
        ))}
      </Tabs>
    </Section>
  );
};
