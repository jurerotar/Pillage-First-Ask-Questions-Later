import { useTranslation } from 'react-i18next';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const ResidenceExpansion = () => {
  const { t } = useTranslation();
  const { culturePoints } = useCulturePoints();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="expansion" />
        <InformationPopover ariaLabel={t('Expansion')}>
          <Text>
            {t(
              "Expansion tracks this village's settlers, administrators, and available expansion slots for founding or conquering additional villages.",
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Expansion')}</Text>
      </SectionContent>
      <SectionContent>
        <OverflowContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Culture points')}</TableHeaderCell>
                <TableHeaderCell>{t('Amount')}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t('Available culture points')}</TableCell>
                <TableCell>
                  {formatNumber(Math.floor(culturePoints.culturePoints))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Current village production')}</TableCell>
                <TableCell>
                  {t('{{amount}} per day', {
                    amount: formatNumber(
                      culturePoints.currentVillageCulturePointsProduction,
                    ),
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Global kingdom production')}</TableCell>
                <TableCell>
                  {t('{{amount}} per day', {
                    amount: formatNumber(
                      culturePoints.playerCulturePointsProduction,
                    ),
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Required for next village')}</TableCell>
                <TableCell>
                  {formatNumber(
                    culturePoints.nextVillageCulturePointsRequirement,
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </OverflowContainer>
      </SectionContent>
    </Section>
  );
};
