import React from 'react';
import { Outlet } from 'react-router-dom';
import { PreferencesProvider } from 'providers/global/preferences-context';

export const AppLayout: React.FC = () => {
  return (
    <PreferencesProvider>
      <Outlet />
    </PreferencesProvider>
  );
};
