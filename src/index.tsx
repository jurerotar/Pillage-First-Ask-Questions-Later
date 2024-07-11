import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/styles.scss';
import './i18n/i18n';
import { router } from './router';
import { ViewportProvider } from 'app/providers/viewport-context';
import { StateProvider } from 'app/providers/state-provider';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ViewportProvider>
      <StateProvider>
        <RouterProvider router={router} />
      </StateProvider>
    </ViewportProvider>
  </React.StrictMode>,
);
