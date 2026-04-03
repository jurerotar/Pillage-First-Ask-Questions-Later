import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SQLiteERD } from 'sqlite-erd';
import 'sqlite-erd/sqlite-erd.css';
import sqlSchema from '../sql-schema/schema.sql?raw';

const rootElement = document.querySelector('#sqlite-erd');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SQLiteERD
        sqlSchema={sqlSchema}
        showSidebar={false}
      />
    </StrictMode>,
  );
}
