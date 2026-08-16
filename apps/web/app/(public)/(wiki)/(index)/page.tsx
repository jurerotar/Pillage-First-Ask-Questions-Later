import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { WikiIndexContent } from '../wiki-pages';

const WikiIndexPage = () => {
  const { t } = useTranslation('public');

  return (
    <>
      <title>{t('{{title}} | Pillage First!', { title: 'Wiki' })}</title>
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Wiki')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <WikiIndexContent />
      </div>
    </>
  );
};

export default WikiIndexPage;
