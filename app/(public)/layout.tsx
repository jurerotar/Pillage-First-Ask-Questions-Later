import { Outlet } from 'react-router';
import { Tooltip } from 'app/components/tooltip';
import { DesktopNavigation } from 'app/(public)/components/desktop-navigation';
import { MobileNavigation } from 'app/(public)/components/mobile-navigation';
import { Footer } from 'app/(public)/components/footer';
import { MDXProvider } from '@mdx-js/react';
import type { ComponentProps } from 'react';
import { Text } from 'app/components/text';
import { Toaster } from 'sonner';

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
      className="mb-2"
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
};

const PublicLayout = () => {
  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
      <Tooltip id="public-tooltip" />
      <MDXProvider components={mdxComponents}>
        <Outlet />
      </MDXProvider>
      <Footer />
      <Toaster position="bottom-right" />
    </>
  );
};

export default PublicLayout;
