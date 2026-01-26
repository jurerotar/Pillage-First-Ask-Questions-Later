import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { generateHashKey } from './utils/hash.ts';

export const vitePluginI18nHashing = (): Plugin => {
  const enabled = process.env.NODE_ENV === 'production';
  let replacementMap: Map<string, string> | null = null;
  let sortedKeys: string[] = [];

  const loadReplacementMap = () => {
    if (replacementMap) {
      return;
    }

    replacementMap = new Map();
    const inputDir = join(
      process.cwd(),
      'app/localization/locales/en-US/extracted',
    );

    try {
      const files = readdirSync(inputDir);
      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const content = readFileSync(join(inputDir, file), 'utf-8');
        const json = JSON.parse(content);
        for (const key of Object.keys(json)) {
          if (key && !replacementMap.has(key)) {
            replacementMap.set(key, generateHashKey(key));
          }
        }
      }

      // Sort keys by length descending to avoid partial matches
      sortedKeys = [...replacementMap.keys()].sort(
        (a, b) => b.length - a.length,
      );
    } catch (error) {
      // If directory doesn't exist or other error, we just don't do replacements
      console.error(
        `[vite-plugin-i18n-hashing] Failed to load localization files: ${error}`,
      );
      replacementMap = new Map();
    }
  };

  return {
    name: 'vite-plugin-i18n-hashing',
    enforce: 'post',

    async transform(code, id) {
      if (!enabled || id.includes('node_modules') || !id.match(/\.(ts|tsx)$/)) {
        return null;
      }

      if (!code.includes('t(') && !code.includes('<Trans')) {
        return null;
      }

      loadReplacementMap();

      if (sortedKeys.length === 0) {
        return null;
      }

      let newCode = code;

      for (const key of sortedKeys) {
        const hashedKey = replacementMap!.get(key)!;

        // Replace translation keys in string literals (single quotes, double quotes, template literals)
        // and within JSX text content (between tags)
        if (newCode.includes(key)) {
          newCode = newCode.split(`'${key}'`).join(`'${hashedKey}'`);
          newCode = newCode.split(`"${key}"`).join(`"${hashedKey}"`);
          newCode = newCode.split(`\`${key}\``).join(`\`${hashedKey}\``);
          newCode = newCode.split(`>${key}<`).join(`>${hashedKey}<`);
        }
      }

      if (newCode !== code) {
        return {
          code: newCode,
          map: null,
        };
      }

      return null;
    },
  };
};
