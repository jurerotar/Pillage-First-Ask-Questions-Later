import React from 'react';
import ReactDOM from 'react-dom/client';
import 'styles/styles.css';
import { PreferencesProvider } from 'providers/preferences-context';
import App from './app';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  </React.StrictMode>
);
