import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import {
  calculateBuildingDurationForLevel,
  getBuildingDefinition,
  getBuildingFieldByBuildingFieldId,
} from 'app/assets/utils/buildings';
import { formatTime } from 'app/utils/time';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { use, useState } from 'react';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';

export const BuildingStatsUpgradeDuration = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = use(BuildingFieldContext);

  const [mainBuildingLevel, setMainBuildingLevel] = useState<number>(1);

  const { buildingId, level } = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId!,
  )!;
  const building = getBuildingDefinition(buildingId);

  const mainBuildingDefinition = getBuildingDefinition('MAIN_BUILDING');
  const buildingDurationModifier =
    mainBuildingDefinition.effects[0].valuesPerLevel[mainBuildingLevel];

  return (
    <SectionContent>
      <Text as="h2">{t('Upgrade duration')}</Text>
      <Text>
        {t(
          'This section displays the time required to upgrade a building at each level, with consideration of the level of your Main Building, artifacts and any other building duration reduction effects.',
        )}
      </Text>
      <div className="flex gap-4 items-center">
        <Text className="font-medium">{t('Main building level')}:</Text>
        <Select
          onValueChange={(value) =>
            setMainBuildingLevel(Number.parseInt(value, 10))
          }
          value={mainBuildingLevel.toString()}
        >
          <SelectTrigger
            title={t('Main building level')}
            aria-label={t('Main building level')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...Array.from({ length: mainBuildingDefinition.maxLevel })].map(
              (_, index) => (
                <SelectItem
                  // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                  key={index}
                  value={(index + 1).toString()}
                >
                  {index + 1}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Level')}</TableHeaderCell>
              <TableHeaderCell colSpan={3}>
                {t('Upgrade duration at Main Building level {{level}}', {
                  level: mainBuildingLevel,
                })}
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
    </SectionContent>
  );
};
