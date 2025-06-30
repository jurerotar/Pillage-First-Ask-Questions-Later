import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { glob } from 'tinyglobby';
import { existsSync, copyFileSync } from 'node:fs';

const copyFolderSync = async (source: string, dest: string): Promise<void> => {
  try {
    // Ensure the destination directory exists, if not, create it
    await mkdir(dest, { recursive: true });

    // Read the contents of the source directory
    const items = await readdir(source);

    // Iterate through all items in the source directory
    for (const item of items) {
      const sourcePath = join(source, item);
      const destPath = join(dest, item);

      // Get the stats of the item
      const stats = await stat(sourcePath);

      if (stats.isDirectory()) {
        // If it's a directory, recursively copy its contents
        await copyFolderSync(sourcePath, destPath);
      } else {
        // If it's a file, copy it
        await copyFile(sourcePath, destPath);
      }
    }
  } catch (err) {
    console.error(`Error while copying folder: ${err}`);
  }
};

const _generateAssetPreloadMaps = async () => {
  const mapFiles = (await glob('public/graphic-packs/**/map/**/*.avif')).map(
    (filePath) => filePath.replace('public', ''),
  );
  const villageFiles = (
    await glob('public/graphic-packs/**/village/**/*.avif')
  ).map((filePath) => filePath.replace('public', ''));
  const heroItemsFiles = (
    await glob('public/graphic-packs/**/hero-items/**/*.avif')
  ).map((filePath) => filePath.replace('public', ''));

  await mkdir('app/asset-preload-paths', { recursive: true });
  await writeFile(
    'app/asset-preload-paths/map.json',
    JSON.stringify({ files: mapFiles }),
    { encoding: 'utf-8' },
  );
  await writeFile(
    'app/asset-preload-paths/village.json',
    JSON.stringify({ files: villageFiles }),
    { encoding: 'utf-8' },
  );
  await writeFile(
    'app/asset-preload-paths/hero-items.json',
    JSON.stringify({ files: heroItemsFiles }),
    { encoding: 'utf-8' },
  );
};

const createDotEnv = () => {
  const envPath = resolve(process.cwd(), '.env');
  const examplePath = resolve(process.cwd(), '.env.example');

  if (existsSync(envPath)) {
    return;
  }

  copyFileSync(examplePath, envPath);
  // biome-ignore lint/suspicious/noConsole: This is here to inform a new developer of new file being created
  console.log('✅ .env file created from .env.example');
};

const sourceDir = 'node_modules/@pillage-first/graphics/dist/graphic-packs';
const destDir = 'public/graphic-packs';

await copyFolderSync(sourceDir, destDir);
// TODO: Consider re-enabling this if you encounter issues with asset loading
// await generateAssetPreloadMaps();
createDotEnv();
