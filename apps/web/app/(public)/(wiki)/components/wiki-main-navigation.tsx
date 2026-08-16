import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Text } from 'app/components/text';
import { wikiPages } from '../wiki-pages';

export const WikiMainNavigation = ({
  showTitle = true,
}: {
  showTitle?: boolean;
}) => {
  const { t } = useTranslation('public');
  const location = useLocation();

  return (
    <nav
      aria-label={t('Wiki Navigation')}
      className="flex flex-col gap-3"
    >
      {showTitle && (
        <Text
          as="h2"
          variant="muted"
          className="uppercase text-xs font-medium"
        >
          {t('Wiki Navigation')}
        </Text>
      )}
      <ul className="flex flex-col gap-1">
        <li>
          <Link
            to="/wiki"
            className={clsx(
              'block rounded-md px-2 py-1.5 text-sm transition-colors',
              location.pathname === '/wiki'
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {t('Wiki')}
          </Link>
        </li>
        {wikiPages.map((page) => {
          const to = `/wiki/${page.slug}`;

          return (
            <li key={page.slug}>
              <Link
                to={to}
                className={clsx(
                  'block rounded-md px-2 py-1.5 text-sm transition-colors',
                  location.pathname === to
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {page.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
