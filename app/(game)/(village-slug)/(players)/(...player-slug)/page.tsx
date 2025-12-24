import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(players)/(...player-slug)/+types/page';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';

const PlayerPage = ({ params }: Route.ComponentProps) => {
  const { playerSlug, serverSlug, villageSlug } = params;
  const { t } = useTranslation();

  const title = `${t('Player - {{playerSlug}}', { playerSlug })} | Pillage First! - ${serverSlug} - ${villageSlug}`;

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
            <BreadcrumbLink to="../statistics">
              {t('Statistics')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {t('Player - {{playerSlug}}', { playerSlug })}
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

export default PlayerPage;
