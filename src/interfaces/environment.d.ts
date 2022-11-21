/* eslint-disable no-unused-vars */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_ENVIRONMENT: 'local' | 'production';
    }
  }
}

export {};
