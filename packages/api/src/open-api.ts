import { createDocument } from 'zod-openapi';
import packageJson from '../../../package.json' with { type: 'json' };
import { paths } from './http/api-routes';

export { paths } from './http/api-routes';

export const document = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Pillage First! worker-based API',
    version: packageJson.version,
    description: 'Pillage First! worker-based API',
  },
  paths,
});
