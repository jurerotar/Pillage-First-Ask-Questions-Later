import { Outlet } from 'react-router';
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
