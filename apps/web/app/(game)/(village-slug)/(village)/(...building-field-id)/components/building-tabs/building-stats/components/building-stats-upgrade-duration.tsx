import { use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  calculateBuildingDurationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { formatTime } from 'app/utils/time';

export const BuildingStatsUpgradeDuration = () => {
  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const { effects } = useEffects();
  const tribe = useTribe();

  const [mainBuildingLevel, setMainBuildingLevel] = useState<number>(1);

  const { buildingId, level } = buildingField!;
  const building = getBuildingDefinition(buildingId);

  const buildingDurationServerEffect = effects.find(
    ({ id, scope }) => id === 'buildingDuration' && scope === 'server',
  )!;

  const mainBuildingDefinition = getBuildingDefinition('MAIN_BUILDING');
  const buildingDurationModifier =
    mainBuildingDefinition.effects(tribe)[0]!.valuesPerLevel[
      mainBuildingLevel
    ] * buildingDurationServerEffect.value;

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Upgrade duration')}>
          <Text>
            {t(
              'This section displays the time required to upgrade a building at each level, with consideration of the level of your Main Building, artifacts and any other building duration reduction effects.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Upgrade duration')}</Text>
      </SectionContent>
      <SectionContent>
        <div className="flex gap-4 items-center">
          <Text className="font-medium">{t('Main building level')}:</Text>
          <Select
            onValueChange={(value) => {
              setMainBuildingLevel(Number.parseInt(value, 10));
            }}
            value={mainBuildingLevel.toString()}
          >
            <SelectTrigger
              title={t('Main building level')}
              aria-label={t('Main building level')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: mainBuildingDefinition.maxLevel }).map(
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
      </SectionContent>
      <SectionContent>
        <OverflowContainer>
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
              {Array.from(
                { length: Math.max(0, building.maxLevel) },
                (_, i) => {
                  const levelNum = i + 1;
                  const duration = calculateBuildingDurationForLevel(
                    buildingId,
                    levelNum,
                  );

                  return (
                    <TableRow
                      key={levelNum}
                      {...(levelNum === level && { className: 'bg-muted' })}
                    >
                      <TableCell>{levelNum}</TableCell>
                      <TableCell>
                        {formatTime(duration * buildingDurationModifier)}
                      </TableCell>
                    </TableRow>
                  );
                },
              )}
            </TableBody>
          </Table>
        </OverflowContainer>
      </SectionContent>
    </Section>
  );
};
