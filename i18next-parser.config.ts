import type { UserConfig } from "i18next-parser";
import type { AvailableLocale } from "app/interfaces/models/locale";

const locales: AvailableLocale[] = ["en-US", "ar-SA"];

export default {
  // Key separator used in your translation keys
  contextSeparator: "_",

  // Save the _old files
  createOldCatalogs: false,

  // Default namespace used in your i18next config
  defaultNamespace: "app",

  // Default value to give to keys with no value
  // You may also specify a function accepting the locale, namespace, key, and value as arguments
  defaultValue: (_locale, _namespace, key) => {
    return key!;
  },

  // Indentation of the catalog files
  indentation: 2,

  // Keep keys from the catalog that are no longer in code
  // You may either specify a boolean to keep or discard all removed keys.
  // You may also specify an array of patterns: the keys from the catalog that are no long in the code but match one of the patterns will be kept.
  // The patterns are applied to the full key including the namespace, the parent keys and the separators.
  keepRemoved: false,

  // Key separator used in your translation keys
  // If you want to use plain English keys, separators such as `.` and `:` will conflict.
  // You might want to set `keySeparator: false` and `namespaceSeparator: false`.
  // That way, `t('Status: Loading...')` will not think that there are a namespace and three separator dots for instance.
  keySeparator: false,

  // Define which lexers should be used for each file type
  lexers: {
    hbs: ["HandlebarsLexer"],
    handlebars: ["HandlebarsLexer"],
    htm: ["HTMLLexer"],
    html: ["HTMLLexer"],
    mjs: ["JavascriptLexer"],
    js: ["JavascriptLexer"], // if you're writing jsx inside .js files, change this to JsxLexer
    ts: ["JavascriptLexer"],
    jsx: ["JsxLexer"],
    tsx: ["JsxLexer"],
    default: ["JavascriptLexer"],
  },

  // Control the line ending format. See options at https://github.com/ryanve/eol
  lineEnding: "lf",

  // An array of the locales in your applications
  locales,

  // Namespace separator used in your translation keys
  // If you want to use plain English keys, separators such as `.` and `:` will conflict.
  // You might want to set `keySeparator: false` and `namespaceSeparator: false`.
  namespaceSeparator: ":",

  // Supports $LOCALE and $NAMESPACE injection
  // Supports JSON (.json) and YAML (.yml) file formats
  // Where to write the locale files relative to process.cwd()
  output: "app/localization/locales/$LOCALE/$NAMESPACE.json",

  // Plural separator used in your translation keys
  // If you want to use plain English keys, separators such as `_` might conflict.
  // You might want to set `pluralSeparator` to a different string that does not occur in your keys.
  // If you don't want to generate keys for plurals (for example, in case you are using ICU format), set `pluralSeparator: false`.
  pluralSeparator: "_",

  // An array of globs that describe where to look for source files
  // relative to the location of the configuration file
  input: ["app/**/*.{ts,tsx}"],

  // Whether to sort the catalog. Can also be a compare function
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#parameters)
  sort: false,

  // Display info about the parsing including some stats
  verbose: false,

  // Exit with an exit code of 1 on warnings
  failOnWarnings: true,

  // Exit with an exit code of 1 when translations are updated (for CI purpose)
  failOnUpdate: false,

  // The locale to compare with default values to determine whether a default value has been changed.
  // If this is set and a default value differs from a translation in the specified locale, all entries
  // for that key across locales are reset to the default value, and existing translations are moved to
  // the `_old` file.
  resetDefaultValueLocale: null,
} satisfies UserConfig;
