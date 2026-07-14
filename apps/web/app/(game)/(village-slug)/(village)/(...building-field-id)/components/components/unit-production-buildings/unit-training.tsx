import { use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TroopTrainingBuildingId } from '@pillage-first/types/models/building';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { useUnits } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-units';
import {
  troopTrainingBuildingConfigMap,
  UnitAttributes,
  UnitCard,
  UnitCost,
  UnitOverview,
  UnitRecruitment,
  UnitRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/unit-production-buildings/components/unit-card';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { TroopTrainingTable } from 'app/(game)/(village-slug)/components/troop-training-table';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

export const UnitTraining = () => {
  const { t } = useTranslation();
  const { getTribeUnitsByCategory } = useUnits();
  const { buildingField } = use(BuildingFieldContext);

  const buildingId = buildingField!.buildingId as TroopTrainingBuildingId;

  const { category } = troopTrainingBuildingConfigMap.get(buildingId)!;

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
        <InformationPopover ariaLabel={t('Train units')}>
          <Text>
            {t(
              'Select the type and number of units to train. Once queued, units will be trained one at a time, in the order you queued them in.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Train units')}</Text>
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
            <UnitCard unitId={id}>
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
