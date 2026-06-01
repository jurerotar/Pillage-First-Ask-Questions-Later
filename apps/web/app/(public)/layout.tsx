import { MDXProvider } from '@mdx-js/react';
import { type ComponentProps, use } from 'react';
import { Links, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from '@react-router/types/app/(public)/+types/layout';
import { DesktopNavigation } from 'app/(public)/components/desktop-navigation';
import { Footer } from 'app/(public)/components/footer';
import { MobileNavigation } from 'app/(public)/components/mobile-navigation';
import { HeadLinks } from 'app/components/head-links';
import { Text } from 'app/components/text';
import { Tooltip } from 'app/components/tooltip';
import { Toaster } from 'app/components/ui/toaster';
import { type AvailableLocale, locales } from 'app/localization/i18n';
import { CookieContext, CookieProvider } from 'app/providers/cookie-provider';

const getLocale = (locale?: string): AvailableLocale => {
  if (!locale || !locales.includes(locale as AvailableLocale)) {
    return 'en-US';
  }

  return locale as AvailableLocale;
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

const LayoutContent = ({ locale }: { locale: AvailableLocale }) => {
  const { uiColorScheme } = use(CookieContext);

  return (
    <html
      lang={locale}
      className={uiColorScheme === 'dark' ? 'dark' : ''}
    >
      <head>
        <HeadLinks />
        <Links />
      </head>
      <body className="bg-background text-foreground transition-colors duration-300">
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

export const Layout = ({ params }: Route.ComponentProps) => {
  const locale = getLocale(params.locale);

  return (
    <CookieProvider>
      <LayoutContent locale={locale} />
    </CookieProvider>
  );
};

export default Layout;
