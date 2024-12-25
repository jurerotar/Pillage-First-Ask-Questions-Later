import { StateProvider } from 'app/providers/state-provider';
import { ViewportProvider } from 'app/providers/viewport-context';
import { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './router';
import './styles/app.css';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <ViewportProvider>
      <StateProvider>
        {/* TODO: Replace global suspense with public & game-specific ones */}
        <Suspense fallback={<>Global Suspense</>}>
          <RouterProvider router={router} />
        </Suspense>
      </StateProvider>
    </ViewportProvider>
  </StrictMode>,
);
