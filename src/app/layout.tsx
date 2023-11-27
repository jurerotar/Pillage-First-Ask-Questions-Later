import React from 'react';
import { Outlet } from 'react-router-dom';
import { PreferencesProvider } from './providers/preferences-context';
import { ViewportProvider } from './providers/viewport-context';

export const AppLayout: React.FC = () => {
  return (
    <ViewportProvider>
      <PreferencesProvider>
        <Outlet />
      </PreferencesProvider>
    </ViewportProvider>
  );
};
