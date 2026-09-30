import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { getWikiPageBySlug } from '../wiki-pages';

const WikiPage = () => {
  const { t } = useTranslation('public');
  const { pageSlug } = useParams();
  const page = getWikiPageBySlug(pageSlug);

  if (!page) {
    throw new Response(null, {
      status: 404,
      statusText: 'Wiki page not found',
    });
  }

  const Content = page.Content;

  return (
    <>
      <title>{t('{{title}} | Pillage First!', { title: page.title })}</title>
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="/wiki">{t('Wiki')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{page.title}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Content page={page} />
      </div>
    </>
  );
};

export default WikiPage;
