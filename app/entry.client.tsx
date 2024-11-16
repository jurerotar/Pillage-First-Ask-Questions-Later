import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { StrictMode } from 'react';

hydrateRoot(
  document,
  <StrictMode>
    <HydratedRouter />
  </StrictMode>,
);
