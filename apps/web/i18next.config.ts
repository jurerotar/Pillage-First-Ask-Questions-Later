import { defineConfig, type I18nextToolkitConfig } from 'i18next-cli';
import { locales } from 'app/localization/i18n';

const i18nextCliConfig: I18nextToolkitConfig = defineConfig({
  locales,
  extract: {
    input: ['app/**/*.{ts,tsx}'],
    preservePatterns: [
      'UNITS.*',
      'BUILDINGS.*',
      'ITEMS.*',
      'QUESTS.*',
      'TRIBES.*',
      'REPUTATIONS.*',
      'FACTIONS.*',
      'RESOURCES.*',
      'ICONS.*',
    ],
    output:
      'app/localization/locales/{{language}}/extracted/{{namespace}}.json',
    defaultNS: 'app',
    keySeparator: false,
    nsSeparator: false,
    contextSeparator: '_',
    ignoredAttributes: [
      'as',
      'size',
      'variant',
      'buildingId',
      'tab',
      'subIcon',
      'name',
      'data-tooltip-id',
      'data-testid',
      'value',
    ],
    functions: ['t'],
    transComponents: ['Trans'],
    removeUnusedKeys: true,
  },
});

export default i18nextCliConfig;
