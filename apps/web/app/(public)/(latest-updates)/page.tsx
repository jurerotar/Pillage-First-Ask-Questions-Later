import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import LatestUpdatesMdx from './mdx/latest-updates.mdx';
import styles from './page.module.css';

const LatestUpdatesPage = () => {
  const { t } = useTranslation('public');

  const title = t('{{title}} | Pillage First!', {
    title: 'Latest updates',
  });

  return (
    <>
      <title>{title}</title>
      <div className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Latest updates')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text as="h1">{t('Latest updates')}</Text>
          <Text>{t('All the latest news and updates about the project.')}</Text>
          <div className={styles.changelog}>
            <LatestUpdatesMdx />
          </div>
        </main>
      </div>
    </>
  );
};

export default LatestUpdatesPage;
