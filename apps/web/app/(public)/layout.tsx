import { MDXProvider } from '@mdx-js/react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Links, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { Toaster } from 'sonner';
import type { Route } from '@react-router/types/app/(public)/+types/layout.ts';
import { DesktopNavigation } from 'app/(public)/components/desktop-navigation';
import { Footer } from 'app/(public)/components/footer';
import { MobileNavigation } from 'app/(public)/components/mobile-navigation';
import { HeadLinks } from 'app/components/head-links.tsx';
import { Text } from 'app/components/text';
import { Tooltip } from 'app/components/tooltip';
import { type AvailableLocale, i18n, locales } from 'app/localization/i18n.ts';

export const loader = async ({ params }: Route.LoaderArgs) => {
  let { locale = 'en-US' } = params;

  if (!locales.includes(locale as AvailableLocale)) {
    locale = 'en-US';
  }

  await i18n.changeLanguage(locale);

  return {
    locale,
  };
};

const mdxComponents: ComponentProps<typeof MDXProvider>['components'] = {
  h1: (props) => (
    <Text
      {...props}
      as="h1"
    />
  ),
  h2: (props) => (
    <Text
      {...props}
      as="h2"
    />
  ),
  h3: (props) => (
    <Text
      {...props}
      as="h3"
    />
  ),
  h4: (props) => (
    <Text
      {...props}
      className="text-gray-400 font-medium text-sm"
      as="h4"
    />
  ),
  h5: (props) => (
    <Text
      {...props}
      as="h5"
    />
  ),
  h6: (props) => (
    <Text
      {...props}
      as="h6"
    />
  ),
  p: (props) => <Text {...props} />,
  ul: (props) => (
    <ul
      {...props}
      className="list-disc ml-4 flex flex-col gap-1 my-2"
    />
  ),
  ol: (props) => (
    <ol
      {...props}
      className="list-decimal ml-6 flex flex-col gap-2"
    />
  ),
  li: (props) => (
    <li
      {...props}
      className="text-foreground"
    />
  ),
};

export const Layout = ({ loaderData }: Route.ComponentProps) => {
  const { locale } = loaderData;

  const { t } = useTranslation();

  return (
    <html lang={locale}>
      <head>
        <meta
          name="description"
          content={t(
            'Pillage First! (Ask Questions Later) is a single-player, real-time, browser-based strategy game inspired by Travian. Manage resources to construct buildings, train units, and wage war against your enemies. Remember: pillage first, ask questions later!',
          )}
        />
        <meta
          name="twitter:card"
          content="summary"
        />
        <meta
          property="og:url"
          content="https://pillagefirst.com"
        />
        <meta
          property="og:type"
          content="website"
        />
        <HeadLinks />
        <Links />
      </head>
      <body>
        <DesktopNavigation />
        <MobileNavigation />
        <Tooltip id="public-tooltip" />
        <MDXProvider components={mdxComponents}>
          <Outlet />
        </MDXProvider>
        <Footer />
        <Toaster position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default Layout;
