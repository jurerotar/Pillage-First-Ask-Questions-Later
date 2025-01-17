import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const sourceDir = 'node_modules/@pillage-first/graphics/dist/graphic-packs';
const destDir = 'public/graphic-packs';

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
    // biome-ignore lint/suspicious/noConsole: Quasi error handling
    console.error(`Error while copying folder: ${err}`);
  }
};

await copyFolderSync(sourceDir, destDir);
