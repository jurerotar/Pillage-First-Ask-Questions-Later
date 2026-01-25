import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { I18nextToolkitConfig } from 'i18next-cli';
import { transformToHashed } from './utils/hash.ts';

export const hashLocalizationFiles = async (
  i18nextCliConfig: I18nextToolkitConfig,
) => {
  const {
    locales,
    extract: { output },
  } = i18nextCliConfig;

  let inputDir: string | undefined;

  if (typeof output === 'string') {
    const languageIndex = output.indexOf('{{language}}');
    if (languageIndex !== -1) {
      inputDir = output.substring(0, languageIndex);
    } else {
      inputDir = dirname(output);
    }
  }

  if (!inputDir) {
    throw new Error('Could not determine input directory from output pattern');
  }

  const outputDir = inputDir;

  for (const locale of locales) {
    const extractedDir = join(inputDir, locale, 'extracted');
    const hashedDir = join(outputDir, locale, 'hashed');

    try {
      const files = await readdir(extractedDir);
      await mkdir(hashedDir, { recursive: true });

      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const inputFile = join(extractedDir, file);
        const outputFile = join(hashedDir, file);

        const content = await readFile(inputFile, 'utf-8');
        const json = JSON.parse(content);

        // Transform to hashed
        const hashedObj = transformToHashed(json);
        await writeFile(
          outputFile,
          JSON.stringify(hashedObj, null, 2),
          'utf-8',
        );
      }
    } catch (error) {
      // @ts-expect-error - error might not have code
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
};
