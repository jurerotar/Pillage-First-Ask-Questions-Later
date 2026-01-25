#!/usr/bin/env node

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createKeyMapping, transformToHashed } from './i18n-hash-utils';

interface MigrationOptions {
  sourceDir: string;
  targetDir: string;
  locales?: string[];
  namespaces?: string[];
}

async function migrateLocalizationFiles(
  options: MigrationOptions,
): Promise<void> {
  const {
    sourceDir,
    targetDir,
    locales = ['en-US'],
    namespaces = [],
  } = options;

  console.log(`Starting migration from ${sourceDir} to ${targetDir}`);

  for (const locale of locales) {
    let namespaceList = namespaces;

    // If no namespaces specified, discover them from the source directory
    if (namespaceList.length === 0) {
      const extractedDir = join(sourceDir, locale, 'extracted');
      try {
        const files = await readdir(extractedDir);
        namespaceList = files
          .filter((file) => file.endsWith('.json'))
          .map((file) => file.replace('.json', ''));
      } catch (error) {
        console.error(
          `Could not read extracted directory for locale ${locale}:`,
          error,
        );
        continue;
      }
    }

    // Create target directories
    await mkdir(join(targetDir, locale, 'hashed'), { recursive: true });

    for (const namespace of namespaceList) {
      const sourceFile = join(
        sourceDir,
        locale,
        'extracted',
        `${namespace}.json`,
      );
      const targetFile = join(targetDir, locale, 'hashed', `${namespace}.json`);
      const mappingFile = join(
        targetDir,
        locale,
        'hashed',
        `${namespace}.mapping.json`,
      );

      try {
        // Check if source file exists
        await stat(sourceFile);

        console.log(`Migrating ${locale}/${namespace}...`);

        // Read source file
        const content = await readFile(sourceFile, 'utf-8');
        const json = JSON.parse(content);

        // Transform to hashed format
        const hashedObj = transformToHashed(json);
        const hashedContent = JSON.stringify(hashedObj, null, 2);

        // Write hashed file
        await writeFile(targetFile, hashedContent, 'utf-8');
        console.log(`  ✓ Created ${targetFile}`);

        // Create mapping file for reference
        const mapping = createKeyMapping(json);
        const mappingContent = JSON.stringify(mapping, null, 2);
        await writeFile(mappingFile, mappingContent, 'utf-8');
        console.log(`  ✓ Created mapping file: ${mappingFile}`);
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          console.warn(
            `  ⚠ Source file does not exist: ${sourceFile}, skipping...`,
          );
        } else {
          console.error(`  ✗ Error migrating ${sourceFile}:`, error);
        }
      }
    }
  }

  console.log('Migration completed!');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const sourceDir =
    args.find((arg) => arg.startsWith('--source='))?.split('=')[1] ||
    './app/localization/locales';
  const targetDir =
    args.find((arg) => arg.startsWith('--target='))?.split('=')[1] ||
    './app/localization/locales';
  const localesArg = args
    .find((arg) => arg.startsWith('--locales='))
    ?.split('=')[1];
  const namespacesArg = args
    .find((arg) => arg.startsWith('--namespaces='))
    ?.split('=')[1];

  const locales = localesArg ? localesArg.split(',') : ['en-US'];
  const namespaces = namespacesArg ? namespacesArg.split(',') : [];

  console.log('Migration options:');
  console.log(`  Source directory: ${sourceDir}`);
  console.log(`  Target directory: ${targetDir}`);
  console.log(`  Locales: ${locales.join(', ')}`);
  if (namespaces.length > 0) {
    console.log(`  Namespaces: ${namespaces.join(', ')}`);
  }

  await migrateLocalizationFiles({
    sourceDir,
    targetDir,
    locales,
    namespaces,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error during migration:', error);
    process.exit(1);
  });
}
