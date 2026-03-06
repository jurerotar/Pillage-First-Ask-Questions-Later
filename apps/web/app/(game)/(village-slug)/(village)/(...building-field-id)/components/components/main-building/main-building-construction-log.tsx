import { useTranslation } from 'react-i18next';
import { useBuildingHistory } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-building-history.ts';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { Text } from 'app/components/text.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table.tsx';

export const MainBuildingConstructionLog = () => {
  const { t } = useTranslation();
  const { buildingHistory } = useBuildingHistory();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Construction log')}</Text>
        <Text>
          {t(
            'Construction log shows last 20 building construction events in this village.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Building')}</TableHeaderCell>
              <TableHeaderCell>{t('Level change')}</TableHeaderCell>
              <TableHeaderCell>{t('Date')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buildingHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  {t(
                    'Construct or upgrade your first building for a record to show here',
                  )}
                </TableCell>
              </TableRow>
            )}
            {buildingHistory.length > 0 && (
              <>
                {buildingHistory.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {t(`BUILDINGS.${event.building}.NAME`)}
                    </TableCell>
                    <TableCell>
                      {event.previousLevel}
                      <span className="mx-0.5">&rarr;</span>
                      {event.newLevel}
                    </TableCell>
                    <TableCell>
                      {new Date(event.timestamp * 1000).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  );
};
