import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { copyFile, mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const clearDirectory = async (path: string) => {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
};

export const copyFolderSync = async (
  source: string,
  dest: string,
): Promise<void> => {
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
  } catch (error) {
    console.error(`Error while copying folder: ${error}`);
  }
};

const installWebAppGraphicPacks = async () => {
  const sourceDir = 'node_modules/@pillage-first/graphics/dist/graphic-packs';
  const destDir = 'apps/web/public/graphic-packs';

  await clearDirectory(destDir);
  await copyFolderSync(sourceDir, destDir);
};

const installFaviconAndLogos = async () => {
  const sourceBaseDir = 'node_modules/@pillage-first/graphics/dist';
  const faviconDestDir = 'apps/web/public/favicon';
  const rootDestDir = 'apps/web/public';

  if (!existsSync(faviconDestDir)) {
    mkdirSync(faviconDestDir, { recursive: true });
  }

  // Copy favicon folder
  const faviconSourceDir = join(sourceBaseDir, 'favicon');
  if (existsSync(faviconSourceDir)) {
    await copyFolderSync(faviconSourceDir, faviconDestDir);
  }

  // Copy pillage-first-logo.* files to rootDestDir
  const files = readdirSync(sourceBaseDir);
  for (const file of files) {
    if (file.startsWith('pillage-first-logo.')) {
      const src = join(sourceBaseDir, file);
      const dest = join(rootDestDir, file);
      copyFileSync(src, dest);
    }
  }
};

const copyLandingScreenshots = async () => {
  const sourceDir = '.github/assets/landing';
  const outputDir = 'apps/web/public/landing';
  const screenshotFiles = new Set(
    (await readdir(sourceDir)).filter((file) => file.endsWith('.avif')),
  );

  await mkdir(outputDir, { recursive: true });

  for (const file of screenshotFiles) {
    await copyFile(join(sourceDir, file), join(outputDir, file));
  }

  for (const file of await readdir(outputDir)) {
    if (
      /^(?:image-|mobile-).*\.(?:avif|jpg)$/u.test(file) &&
      !screenshotFiles.has(file)
    ) {
      await unlink(join(outputDir, file));
    }
  }
};

await installWebAppGraphicPacks();
await installFaviconAndLogos();
await copyLandingScreenshots();
