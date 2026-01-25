import {
  defineConfig,
  type I18nextToolkitConfig,
  recommendedAcceptedAttributes,
  recommendedAcceptedTags,
} from 'i18next-cli';

const i18nextCliConfig: I18nextToolkitConfig = defineConfig({
  locales: ['en-US'],
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
  lint: {
    acceptedTags: recommendedAcceptedTags,
    acceptedAttributes: recommendedAcceptedAttributes,
  },
});

export default i18nextCliConfig;
