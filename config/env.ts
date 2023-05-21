import { Env } from 'interfaces/models/env';

export const env: Env = {
  environment: import.meta.env.VITE_ENVIRONMENT,
  databaseName: import.meta.env.VITE_DATABASE_NAME
};
