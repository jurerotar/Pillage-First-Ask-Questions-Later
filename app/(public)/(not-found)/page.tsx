import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Link } from 'react-router';
import { Button } from 'app/components/ui/button';

const NotFoundPage = () => {
  const { t } = useTranslation('public');

  const title = t('{{title}} | Pillage First!', { title: 'Page not found' });

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
            <BreadcrumbItem>{t('Not found')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text as="h1">{t('Page not found')}</Text>
          <Text>
            {t("Sorry — we couldn't find the page you're looking for.")}
          </Text>
          <Text>
            {t(
              'This may be due to a mistyped address, a removed page, or an outdated link. If you believe this is an error on our side, please do not hesitate to raise this in our Discord server.',
            )}
          </Text>
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-2">
              <Link to="/game-worlds/create">
                <Button variant="outline">{t('Create new game world')}</Button>
              </Link>

              <Link to="/game-worlds">
                <Button variant="outline">{t('Your game worlds')}</Button>
              </Link>
            </div>
            <Link to="/">
              <Button>{t('Return to homepage')}</Button>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default NotFoundPage;
