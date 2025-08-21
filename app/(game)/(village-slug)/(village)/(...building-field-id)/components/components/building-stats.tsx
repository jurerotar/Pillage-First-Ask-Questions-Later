import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  getBuildingData,
  getBuildingFieldByBuildingFieldId,
} from 'app/(game)/(village-slug)/utils/building';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Icon } from 'app/components/icon';
import { formatNumber } from 'app/utils/common';
import { formatTime } from 'app/utils/time';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';

export const BuildingStats = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { total: buildingDurationModifier } =
    useComputedEffect('buildingDuration');
  const { buildingId, level } = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId!,
  )!;
  const building = getBuildingData(buildingId);

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="upgrade-cost" />
        <Text as="h2">{t('Upgrade details')}</Text>
        <Text>
          {t(
            'This section provides detailed information about building upgrades, including the resource costs and the time required to reach each level. Use the tabs below to explore how upgrades impact both your economy and strategy.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Tabs>
          <TabList>
            <Tab>{t('Upgrade cost')}</Tab>
            <Tab>{t('Upgrade duration')}</Tab>
          </TabList>
          <TabPanel>
            <section className="flex flex-col gap-2">
              <Text as="h2">{t('Upgrade cost')}</Text>
              <Text>
                {t(
                  'This section displays the resource costs required to upgrade a building at each level. It includes a breakdown of wood, clay, iron, and wheat needed for each level from 1 upward.',
                )}
              </Text>
              <div className="overflow-x-scroll scrollbar-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t('Level')}</TableHeaderCell>
                      <TableHeaderCell>
                        <Icon
                          className="inline-flex size-6"
                          type="wood"
                        />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon
                          className="inline-flex size-6"
                          type="clay"
                        />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon
                          className="inline-flex size-6"
                          type="iron"
                        />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon
                          className="inline-flex size-6"
                          type="wheat"
                        />
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(building.maxLevel)].map((_, index) => {
                      const cost = calculateBuildingCostForLevel(
                        building.id,
                        index + 1,
                      );

                      return (
                        <TableRow
                          // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                          key={index}
                          {...(index + 1 === level && {
                            className: 'bg-gray-100',
                          })}
                        >
                          <TableHeaderCell>{index + 1}</TableHeaderCell>
                          <TableCell>{formatNumber(cost[0])}</TableCell>
                          <TableCell>{formatNumber(cost[1])}</TableCell>
                          <TableCell>{formatNumber(cost[2])}</TableCell>
                          <TableCell>{formatNumber(cost[3])}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabPanel>
          <TabPanel>
            <section className="flex flex-col gap-2">
              <Text as="h2">{t('Upgrade duration')}</Text>
              <Text>
                {t(
                  'This section displays the time required to upgrade a building at each level, with consideration of the level of your Main Building, artifacts and any other building duration reduction effects.',
                )}
              </Text>
              <div className="overflow-x-scroll scrollbar-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t('Level')}</TableHeaderCell>
                      <TableHeaderCell colSpan={3}>
                        {t('Upgrade duration')}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(building.maxLevel)].map((_, index) => {
                      const duration = calculateBuildingDurationForLevel(
                        buildingId,
                        index + 1,
                      );

                      return (
                        <TableRow
                          // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                          key={index}
                          {...(index + 1 === level && {
                            className: 'bg-gray-100',
                          })}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {formatTime(duration * buildingDurationModifier)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabPanel>
        </Tabs>
      </SectionContent>
    </Section>
  );
};
