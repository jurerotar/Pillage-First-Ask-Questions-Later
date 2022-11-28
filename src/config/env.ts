import { Env } from 'interfaces/models/env';

export const env: Env = {
  environment: process.env.REACT_APP_ENVIRONMENT,
  features: {
    usesIsometricMapStyle: true
  }
};
