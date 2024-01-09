import React from 'react';
import { Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { StateProvider } from 'app/providers/state-provider';
import { ViewportProvider } from 'app/providers/viewport-context';

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
