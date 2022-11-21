import React from 'react';
import ReactDOM from 'react-dom/client';
import 'styles/styles.scss';
import { PreferencesProvider } from 'providers/global/preferences-context';
import { ModalProvider } from 'providers/global/modal-context';
import { ApplicationProvider } from 'providers/global/application-context';
import { App } from './app';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ApplicationProvider>
      <PreferencesProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </PreferencesProvider>
    </ApplicationProvider>
  </React.StrictMode>
);
