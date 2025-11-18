import { Outlet } from 'react-router';
import { Tooltip } from 'app/components/tooltip';
import { DesktopNavigation } from 'app/(public)/components/desktop-navigation';
import { MobileNavigation } from 'app/(public)/components/mobile-navigation';
import { Footer } from 'app/(public)/components/footer';

const PublicLayout = () => {
  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
      <Tooltip id="public-tooltip" />
      <Outlet />
      <Footer />
    </>
  );
};

export default PublicLayout;
