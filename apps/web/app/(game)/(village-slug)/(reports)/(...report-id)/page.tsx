import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';
import { useReport } from 'app/(game)/(village-slug)/hooks/use-reports';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId, villageSlug, serverSlug } = params;
  const { t } = useTranslation();
  const { report, markAsRead } = useReport(Number(reportId));

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const title = `${t('Report - {{reportId}}', { reportId })} | Pillage First! - ${serverSlug} - ${villageSlug}`;
  const { attacker, defender, attackers, defenders, bonuses, loot } =
    report.payload;

  return (
    <PageContents>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="../reports">{t('Reports')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {t('Report - {{reportId}}', { reportId })}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Text as="h1">{t(report.type)}</Text>

      <Text>
        {t('Outcome')}: <strong>{t(report.outcome)}</strong>
      </Text>

      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <Text as="h2">{t('Attacker')}</Text>
          <Text>
            {attacker.villageName ?? t('Unknown')} ({attacker.coordinates.x}|
            {attacker.coordinates.y})
          </Text>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Unit')}</TableHeaderCell>
                <TableHeaderCell>{t('Sent')}</TableHeaderCell>
                <TableHeaderCell>{t('Lost')}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attackers.map(({ unitId, amount, losses }) => (
                <TableRow key={unitId}>
                  <TableCell>{unitId}</TableCell>
                  <TableCell>{amount}</TableCell>
                  <TableCell>{losses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section>
          <Text as="h2">{t('Defender')}</Text>
          <Text>
            {defender.villageName ?? t('Wild oasis')} ({defender.coordinates.x}|
            {defender.coordinates.y})
          </Text>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Unit')}</TableHeaderCell>
                <TableHeaderCell>{t('Present')}</TableHeaderCell>
                <TableHeaderCell>{t('Lost')}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defenders.map(({ unitId, amount, losses }) => (
                <TableRow key={unitId}>
                  <TableCell>{unitId}</TableCell>
                  <TableCell>{amount}</TableCell>
                  <TableCell>{losses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>

      <section>
        <Text as="h2">{t('Defence bonuses')}</Text>
        <Text>
          {t('Wall bonus')}: ×{bonuses.wallDefenceBonus.toFixed(2)} +
          {bonuses.wallDefenceBase} {t('Moral')}: ×
          {bonuses.moralBonus.toFixed(2)}
          {bonuses.oasisDefenceBonus > 0 && (
            <>
              {' '}
              {t('Oasis')}: ×{bonuses.oasisDefenceBonus.toFixed(2)}
            </>
          )}
        </Text>
      </section>

      {loot && (
        <section>
          <Text as="h2">{t('Loot')}</Text>
          <Text>
            {t('Wood')}: {loot[0]} · {t('Clay')}: {loot[1]} · {t('Iron')}:{' '}
            {loot[2]} · {t('Wheat')}: {loot[3]}
          </Text>
        </section>
      )}
    </PageContents>
  );
};

export default ReportPage;
