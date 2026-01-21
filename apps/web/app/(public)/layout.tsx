import { MDXProvider } from '@mdx-js/react';
import type { ComponentProps } from 'react';
import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { DesktopNavigation } from 'app/(public)/components/desktop-navigation';
import { Footer } from 'app/(public)/components/footer';
import { MobileNavigation } from 'app/(public)/components/mobile-navigation';
import { Text } from 'app/components/text';
import { Tooltip } from 'app/components/tooltip';

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
