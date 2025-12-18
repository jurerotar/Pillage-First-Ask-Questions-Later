import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { useTranslation } from 'react-i18next';
import GetInvolvedMdx from './mdx/get-involved.mdx';

const GetInvolvedPage = () => {
  const { t } = useTranslation('public');

  const title = t('{{title}} | Pillage First!', { title: 'Get involved' });

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
            <BreadcrumbItem>{t('Get involved')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <GetInvolvedMdx />
        </main>
      </div>
    </>
  );
};

export default GetInvolvedPage;
