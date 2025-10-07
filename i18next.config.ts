import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en-US'],
  extract: {
    input: [
      // Only game localizations are extracted for now, public localizations are hardcoded to English.
      'app/(game)/**/*.{ts,tsx}',
    ],
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
  },
});
