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

        // Escape key for use in Regex if we were to use regex, but user said "simply search if current file includes any of the hashed keys"
        // Wait, "search if current file includes any of the hashed keys" -> he probably meant "original keys".
        // If I use simple .replaceAll, it might replace keys inside other strings that are NOT t() or <Trans> calls.
        // But the issue description says: "In vite plugin, you actually don't need the regex parsing. You simply need to search if current file includes any of the hashed keys, and if it does, just replace it from en-us file"

        // I'll use a safer approach: replace only within string literals that are likely to be translation keys.
        // Actually, if he wants to avoid regex parsing COMPLETELY, he might be okay with global replacement if the keys are unique enough.
        // But translation keys like "Notifications" might appear elsewhere.

        // Let's try to follow "simply search ... and replace" but maybe still be a bit careful.
        // If I use replaceAll(key, hashedKey), it's very aggressive.

        // Let's re-read: "you actually don't need the regex parsing. You simply need to search if current file includes any of the hashed keys, and if it does, just replace it from en-us file"
        // I think he means replacing the keys globally in the file.

        if (newCode.includes(key)) {
          // To be safe, we should probably only replace if it's quoted or inside <Trans>
          // But he specifically said "simply search ... just replace".

          // Let's use a simple regex that matches the key when it's surrounded by quotes or tags.
          // This avoids replacing "Notifications" in a comment or variable name if it's not quoted.

          // If I use: newCode = newCode.split(`'${key}'`).join(`'${hashedKey}'`);
          // and for ", and for `

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
