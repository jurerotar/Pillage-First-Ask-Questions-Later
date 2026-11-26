import { MDXProvider } from '@mdx-js/react';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';

const mdxComponents: ComponentProps<typeof MDXProvider>['components'] = {
  h2: ({ children, id, ...props }) => (
    <Text
      {...props}
      as="h2"
      className="mt-3 scroll-mt-24"
      id={
        id ??
        (typeof children === 'string'
          ? children.toLowerCase().replaceAll(' ', '-')
          : undefined)
      }
    >
      {children}
    </Text>
  ),
};

export const WikiArticlePage = ({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) => {
  const { t } = useTranslation('public');
  const wikiTitle = t('Wiki');
  const articleTitle = title ?? wikiTitle;

  return (
    <>
      <title>{t('{{title}} | Pillage First!', { title: articleTitle })}</title>
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {title ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink to="/wiki">{wikiTitle}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>{title}</BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>{wikiTitle}</BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <article className="flex flex-col gap-3">
          <Text
            as="h1"
            className="text-3xl font-medium leading-tight lg:text-5xl"
          >
            {articleTitle}
          </Text>
          <MDXProvider components={mdxComponents}>{children}</MDXProvider>
        </article>
      </div>
    </>
  );
};
