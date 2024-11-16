import type React from 'react';
import { Outlet } from 'react-router';

const PublicLayout: React.FC = () => {
  return <Outlet />;
};

export default PublicLayout;
