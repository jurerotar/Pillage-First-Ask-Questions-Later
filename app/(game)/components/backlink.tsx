import { IoIosArrowBack } from 'react-icons/io';
import type { Location } from 'react-router';
import { Link, useLocation } from 'react-router';
import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import type { LocationState } from 'app/interfaces/location-state';
import { useTranslation } from 'react-i18next';

const removeLastPathSegment = (path: string) => {
  if (!path || path === '/') {
    return path;
  }

  const segments = path.split('/').filter(Boolean);
  segments.pop();

  return `/${segments.join('/')}`;
};

export const Backlink = () => {
  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();
  const { pathname, state }: Location<LocationState> = useLocation();

  const previousLocationPathname = state?.previousLocationPathname;
  const proposedParentPath = removeLastPathSegment(pathname);

  const segmentAmount = proposedParentPath.split('/').length;

  // The issue here is that /statistics or /hero doesn't really have a parent path, nor do we always have history available at all times, even if we tracked it manually (for example on a refresh).
  // So, whenever we have a previous location, link there, else check if parent path exists, if it does, link there, else link to resources
  const parentPath = (() => {
    if (previousLocationPathname) {
      return previousLocationPathname;
    }
    return segmentAmount <= 4 ? resourcesPath : proposedParentPath;
  })();

  return (
    <Link
      to={parentPath}
      className="flex items-center gap-1"
    >
      <IoIosArrowBack className="mt-[2px]" />
      <span className="">{t('Back')}</span>
    </Link>
  );
};
