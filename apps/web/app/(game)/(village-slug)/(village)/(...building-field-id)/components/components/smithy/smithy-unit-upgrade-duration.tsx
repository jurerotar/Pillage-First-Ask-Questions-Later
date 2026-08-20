import { useTranslation } from 'react-i18next';
import {
  calculateUnitUpgradeDurationForLevel,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Unit } from '@pillage-first/types/models/unit';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
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

const isSmithyUpgradeableUnit = ({ category }: Unit) => {
  return category !== 'administration';
};

export const SmithyUnitUpgradeDuration = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { total: unitImprovementDurationModifier } = useComputedEffect(
    'unitImprovementDuration',
  );

  const upgradableUnits = getUnitsByTribe(tribe).filter(
    isSmithyUpgradeableUnit,
  );

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Unit upgrade duration')}>
          <Text>
            {t(
              'This section displays the time required to improve each smithy-upgradable unit from level 1 to 20, including active unit improvement duration effects.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Unit upgrade duration')}</Text>
      </SectionContent>
      <SectionContent>
        <OverflowContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell className="w-20">{t('Level')}</TableHeaderCell>
                {upgradableUnits.map((unit) => (
                  <TableHeaderCell
                    key={unit.id}
                    className="w-28"
                    title={t(`UNITS.${unit.id}.NAME`)}
                    aria-label={t(`UNITS.${unit.id}.NAME`)}
                  >
                    <div className="flex justify-center">
                      <Icon
                        type={unitIdToUnitIconMapper(unit.id)}
                        className="size-5"
                      />
                    </div>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => (
                <TableRow key={level}>
                  <TableCell className="font-medium">{level}</TableCell>
                  {upgradableUnits.map((unit) => (
                    <TableCell
                      key={unit.id}
                      className="whitespace-nowrap"
                    >
                      {formatTime(
                        unitImprovementDurationModifier *
                          calculateUnitUpgradeDurationForLevel(unit.id, level),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </OverflowContainer>
      </SectionContent>
    </Section>
  );
};
