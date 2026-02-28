import { Outlet } from 'react-router';
import { initFaro } from 'app/instrumentation/faro';
import { StateProvider } from 'app/providers/state-provider';
import './localization/i18n';
import './styles/app.css';

await initFaro();

const App = () => {
  return (
    <StateProvider>
      <Outlet />
    </StateProvider>
  );
};

export default App;
