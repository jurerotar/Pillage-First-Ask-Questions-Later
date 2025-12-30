import { use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  calculateBuildingCostForLevel,
  calculateTotalCulturePointsForLevel,
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
  getBuildingFieldByBuildingFieldId,
} from '@pillage-first/game-assets/buildings/utils';
import { formatNumber } from '@pillage-first/utils/format';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const BuildingStatsUpgradeCost = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = use(BuildingFieldContext);

  const { buildingId, level } = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
  )!;
  const building = getBuildingDefinition(buildingId);

  return (
    <section className="flex flex-col gap-2">
      <Text as="h2">{t('Upgrade cost & benefits')}</Text>
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
              <TableHeaderCell>
                <Icon
                  className="inline-flex size-6"
                  type="population"
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <Icon
                  className="inline-flex size-6"
                  type="culturePoints"
                />
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(building.maxLevel)].map((_, index) => {
              const buildingLevel = index + 1;

              const cost = calculateBuildingCostForLevel(
                building.id,
                buildingLevel,
              );

              const totalPopulation = calculateTotalPopulationForLevel(
                buildingId,
                buildingLevel,
              );
              const totalCulturePoints = calculateTotalCulturePointsForLevel(
                buildingId,
                buildingLevel,
              );

              return (
                <TableRow
                  // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                  key={index}
                  {...(buildingLevel === level && {
                    className: 'bg-gray-100',
                  })}
                >
                  <TableHeaderCell>{buildingLevel}</TableHeaderCell>
                  <TableCell>{formatNumber(cost[0])}</TableCell>
                  <TableCell>{formatNumber(cost[1])}</TableCell>
                  <TableCell>{formatNumber(cost[2])}</TableCell>
                  <TableCell>{formatNumber(cost[3])}</TableCell>
                  <TableCell>{formatNumber(totalPopulation)}</TableCell>
                  <TableCell>{formatNumber(totalCulturePoints)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
