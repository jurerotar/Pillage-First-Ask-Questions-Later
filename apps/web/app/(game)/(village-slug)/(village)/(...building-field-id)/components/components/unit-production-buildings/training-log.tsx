import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useUnitTrainingHistory } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/hooks/use-unit-training-history.ts';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider.tsx';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { Icon } from 'app/components/icon.tsx';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons.tsx';
import { Text } from 'app/components/text.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table.tsx';

export const TrainingLog = () => {
  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const { unitTrainingHistory } = useUnitTrainingHistory(
    buildingField!.buildingId,
  );

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Training log')}</Text>
        <Text>{t('Last 20 unit training batches in this building.')}</Text>
      </SectionContent>

      <SectionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Unit')}</TableHeaderCell>
              <TableHeaderCell>{t('Amount')}</TableHeaderCell>
              <TableHeaderCell>{t('Date')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitTrainingHistory.map((batch, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon
                      type={unitIdToUnitIconMapper(batch.unit)}
                      className="size-4"
                    />
                    {t(`UNITS.${batch.unit}.NAME`)}
                  </div>
                </TableCell>
                <TableCell>{batch.amount}</TableCell>
                <TableCell>
                  {new Date(batch.timestamp * 1000).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  );
};
