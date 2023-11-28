import React from 'react';
import { Outlet } from 'react-router-dom';
import { ViewportProvider } from './providers/viewport-context';

export const AppLayout: React.FC = () => {
  return (
    <ViewportProvider>
      <Outlet />
    </ViewportProvider>
  );
};
