import React from 'react';
import ReactDOM from 'react-dom/client';
import 'styles/styles.css';
import { PreferencesProvider } from 'providers/preferences-context';
import { GameProvider } from 'providers/game-context';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <PreferencesProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </PreferencesProvider>
  </React.StrictMode>
);
