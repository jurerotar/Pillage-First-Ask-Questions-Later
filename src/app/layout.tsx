import { StateProvider } from 'app/providers/state-provider';
import { ViewportProvider } from 'app/providers/viewport-context';
import type React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';

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
