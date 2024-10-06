import type React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return <Outlet />;
};

export default PublicLayout;
