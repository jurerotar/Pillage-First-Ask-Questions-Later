import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  calculateUpgradedValue,
  getSmithyUpgradeableUnitsByTribe,
  getUnitDefinition,
} from '@pillage-first/game-assets/utils/units';
import type { Unit } from '@pillage-first/types/models/unit';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
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

const levels = Array.from({ length: 20 }, (_, index) => index + 1);

export const SmithyUnitUpgradeTable = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { total: unitImprovementDurationModifier } = useComputedEffect(
    'unitImprovementDuration',
  );

  const upgradableUnits = getSmithyUpgradeableUnitsByTribe(tribe);
  const [selectedUnitId, setSelectedUnitId] = useState<Unit['id']>(
    upgradableUnits[0]!.id,
  );
  const selectedUnit = getUnitDefinition(selectedUnitId);
  const upgradeStats = [
    { id: 'attack', value: selectedUnit.attack, label: t('Attack') },
    {
      id: 'infantryDefence',
      value: selectedUnit.infantryDefence,
      label: t('Infantry defence'),
    },
    {
      id: 'cavalryDefence',
      value: selectedUnit.cavalryDefence,
      label: t('Cavalry defence'),
    },
  ] as const;

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Unit upgrade table')}>
          <Text>
            {t(
              'This section displays each smithy-upgradable unit level with its resource cost, duration and upgraded combat attributes.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Unit upgrade table')}</Text>
      </SectionContent>
      <SectionContent>
        <Select
          value={selectedUnitId}
          onValueChange={(value) => {
            setSelectedUnitId(value as Unit['id']);
          }}
        >
          <SelectTrigger className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {upgradableUnits.map(({ id }) => (
              <SelectItem
                key={id}
                value={id}
              >
                <span className="flex items-center gap-2">
                  <Icon
                    type={unitIdToUnitIconMapper(id)}
                    className="size-5"
                  />
                  {t(`UNITS.${id}.NAME`)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SectionContent>
      <SectionContent>
        <OverflowContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Level')}</TableHeaderCell>
                <TableHeaderCell>{t('Cost')}</TableHeaderCell>
                <TableHeaderCell>{t('Duration')}</TableHeaderCell>
                {upgradeStats.map(({ id, label }) => (
                  <TableHeaderCell
                    key={id}
                    title={label}
                    aria-label={label}
                  >
                    <Icon
                      type={id}
                      className="mx-auto size-5"
                    />
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => {
                const upgradeCost = calculateUnitUpgradeCostForLevel(
                  selectedUnitId,
                  level,
                );

                return (
                  <TableRow key={level}>
                    <TableCell className="font-medium">{level}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 whitespace-nowrap justify-center">
                        <Resources
                          resources={upgradeCost}
                          iconClassName="size-4"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatTime(
                        unitImprovementDurationModifier *
                          calculateUnitUpgradeDurationForLevel(
                            selectedUnitId,
                            level,
                          ),
                      )}
                    </TableCell>
                    {upgradeStats.map(({ id, value }) => (
                      <TableCell
                        key={id}
                        className="text-center"
                      >
                        {calculateUpgradedValue(value, level)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </OverflowContainer>
      </SectionContent>
    </Section>
  );
};
