import { defineConfig } from '@lingui/cli';

export default defineConfig({
  sourceLocale: 'en-US',
  locales: ['en-US'],
  catalogs: [
    {
      path: '<rootDir>/locales/{locale}/app',
      include: ['app'],
    },
  ],
});
