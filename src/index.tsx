import React from 'react';
import ReactDOM from 'react-dom/client';
import 'styles/styles.scss';
import { RouterProvider } from 'react-router-dom';
import 'i18n/i18n';
import { router } from './router';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
