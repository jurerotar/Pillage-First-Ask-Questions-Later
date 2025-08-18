import { Outlet } from 'react-router';
import { loadPublicTranslations } from 'app/localization/loaders/public';
import { Tooltip } from 'app/components/tooltip';

export const clientLoader = async () => {
  // const locale = await getCookie('locale', 'en-US');
  const locale = 'en-US';

  await loadPublicTranslations(locale);
};

const PublicLayout = () => {
  return (
    <>
      <Tooltip id="public-tooltip" />
      <Outlet />
    </>
  );
};

export default PublicLayout;
