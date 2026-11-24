import { Outlet, Scripts } from 'react-router';
import { ThemedDocument } from 'app/components/themed-document';
import { useAppUpdate } from 'app/hooks/use-app-update';
import { initFaro } from 'app/instrumentation/faro';
import { StateProvider } from 'app/providers/state-provider';
import './localization/i18n';
import './styles/app.css';
import type { Route } from '@react-router/types/app/+types/root';
import { clientSessionMiddleware } from 'app/middleware/client-session-middleware';

await initFaro();

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  clientSessionMiddleware,
];

export const HydrateFallback = () => (
  <ThemedDocument
    lang="en"
    head={
      <>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <title>Loading...</title>
      </>
    }
  >
    <Scripts />
  </ThemedDocument>
);

const AppContent = () => {
  useAppUpdate();

  return <Outlet />;
};

const App = () => {
  return (
    <StateProvider>
      <AppContent />
    </StateProvider>
  );
};

export default App;
