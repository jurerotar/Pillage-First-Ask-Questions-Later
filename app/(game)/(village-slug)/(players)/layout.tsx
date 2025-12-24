import { Outlet } from 'react-router';
import { redirectToStatistics } from './middlewares/redirect-to-statistics';

export const clientMiddleware = [redirectToStatistics];

const Layout = () => {
  return <Outlet />;
};

export default Layout;
