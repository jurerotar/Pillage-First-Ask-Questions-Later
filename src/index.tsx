import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/styles.scss';
import './i18n/i18n';
import { StateProvider } from 'app/providers/state-provider';
import { ViewportProvider } from 'app/providers/viewport-context';
import { router } from './router';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ViewportProvider>
      <StateProvider>
        {/* TODO: Replace global suspense with public & game-specific ones */}
        <Suspense fallback={<>Global Suspense</>}>
          <RouterProvider router={router} />
        </Suspense>
      </StateProvider>
    </ViewportProvider>
  </React.StrictMode>,
);
