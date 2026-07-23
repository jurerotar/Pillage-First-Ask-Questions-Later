import { MDXProvider } from '@mdx-js/react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import FrequentlyAskedQuestionsMdx from './mdx/frequently-asked-questions.mdx';

const mdxComponents: ComponentProps<typeof MDXProvider>['components'] = {
  h2: (props) => (
    <Text
      {...props}
      className="mb-4 !text-2xl"
      as="h2"
    />
  ),
};

const FrequentlyAskedQuestionsPage = () => {
  const { t } = useTranslation('public');

  const title = t('{{title}} | Pillage First!', {
    title: 'Frequently asked questions',
  });

  return (
    <PageContents>
      <title>{title}</title>
      <div className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Frequently asked questions')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <MDXProvider components={mdxComponents}>
            <FrequentlyAskedQuestionsMdx />
          </MDXProvider>
        </main>
      </div>
    </PageContents>
  );
};

export default FrequentlyAskedQuestionsPage;
