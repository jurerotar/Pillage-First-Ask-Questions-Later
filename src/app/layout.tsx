import React from 'react';
import { Outlet } from 'react-router-dom';
import { StateProvider } from 'app/providers/state-provider';
import { HelmetProvider } from 'react-helmet-async';
import { ViewportProvider } from './providers/viewport-context';

export const AppLayout: React.FC = () => {
  return (
    <HelmetProvider>
      <StateProvider>
        <ViewportProvider>
          <Outlet />
        </ViewportProvider>
      </StateProvider>
    </HelmetProvider>
  );
};
