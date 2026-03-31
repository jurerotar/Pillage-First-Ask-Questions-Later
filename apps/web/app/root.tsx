import { Outlet } from 'react-router';
import { initFaro } from 'app/instrumentation/faro';
import { StateProvider } from 'app/providers/state-provider';
import './localization/i18n';
import './styles/app.css';
import type { Route } from '@react-router/types/app/+types/root';
import { WebRTCAdvertiser } from 'app/components/webrtc-advertiser';
import { clientSessionMiddleware } from 'app/middleware/client-session-middleware';

await initFaro();

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  clientSessionMiddleware,
];

const App = () => {
  return (
    <StateProvider>
      <WebRTCAdvertiser />
      <Outlet />
    </StateProvider>
  );
};

export default App;
