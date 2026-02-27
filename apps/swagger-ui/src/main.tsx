import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { document as apiDocument } from '@pillage-first/api/open-api';

// Replaced colon-prefixed path parameters (e.g., `:playerId`) with curly brace-enclosed parameters (e.g., `{playerId}`) to comply with OpenAPI specifications.
const spec = JSON.parse(
  JSON.stringify(apiDocument).replaceAll(
    /"\/([^"]*):([^"/]+)([^"]*)"/g,
    (match) => {
      return match.replaceAll(/:([a-zA-Z0-9_]+)/g, '{$1}');
    },
  ),
);

const rootElement = document.querySelector('#swagger-ui');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SwaggerUI
        spec={spec}
        deepLinking={true}
      />
    </StrictMode>,
  );
}
