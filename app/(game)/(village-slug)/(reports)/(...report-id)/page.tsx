import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId, villageSlug, serverSlug } = params;
  const { t } = useTranslation();

  const title = `${t('Report - {{playerSlug}}', { reportId })} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
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
      <Text as="h1">{t('Player')}</Text>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </>
  );
};

export default ReportPage;
