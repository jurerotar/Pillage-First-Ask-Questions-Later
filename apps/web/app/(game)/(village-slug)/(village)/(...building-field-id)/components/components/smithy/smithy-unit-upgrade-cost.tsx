import { useTranslation } from 'react-i18next';
import {
  calculateUnitUpgradeCostForLevel,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Unit } from '@pillage-first/types/models/unit';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
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

const levels = Array.from({ length: 20 }, (_, index) => index + 1);

const isSmithyUpgradeableUnit = ({ category }: Unit) => {
  return category !== 'administration';
};

export const SmithyUnitUpgradeCost = () => {
  const { t } = useTranslation();
  const tribe = useTribe();

  const upgradableUnits = getUnitsByTribe(tribe).filter(
    isSmithyUpgradeableUnit,
  );

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Unit upgrade cost')}>
          <Text>
            {t(
              'This section displays the resources required to improve each smithy-upgradable unit from level 1 to 20.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Unit upgrade cost')}</Text>
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
                    className="w-72"
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
                    <TableCell key={unit.id}>
                      <div className="flex justify-center gap-2 whitespace-nowrap">
                        <Resources
                          resources={calculateUnitUpgradeCostForLevel(
                            unit.id,
                            level,
                          )}
                          iconClassName="size-4"
                        />
                      </div>
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
