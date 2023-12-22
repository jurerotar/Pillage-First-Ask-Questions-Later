import React from 'react';
import { Outlet } from 'react-router-dom';
import { StateProvider } from 'app/providers/state-provider';
import { ViewportProvider } from './providers/viewport-context';

export const AppLayout: React.FC = () => {
  return (
    <StateProvider>
      <ViewportProvider>
        <Outlet />
      </ViewportProvider>
    </StateProvider>
  );
};
