import React from 'react';
import ReactDOM from 'react-dom/client';
import 'styles/styles.scss';
import { PreferencesProvider } from 'providers/preferences-context';
import { ModalProvider } from 'providers/modal-context';
import App from './app';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <PreferencesProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </PreferencesProvider>
  </React.StrictMode>
);
