import { Env } from 'interfaces/models/env';
import { env } from 'config/env';

export const useEnvironment = (): Env => {
  return {
    ...env
  };
};
