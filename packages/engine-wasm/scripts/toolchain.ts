import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const version = z.string().regex(/^\d+\.\d+\.\d+$/);
export const toolchain = z
  .strictObject({
    emscripten: version,
    hermes: z.strictObject({
      repository: z.url(),
      commit: z.string().regex(/^[a-f0-9]{40}$/),
    }),
    sqlite: z.strictObject({
      version,
      year: z.number().int().min(2000),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  })
  .parse(
    JSON.parse(
      await readFile(new URL('../toolchain.json', import.meta.url), 'utf8'),
    ),
  );

export const dockerImage = `emscripten/emsdk:${toolchain.emscripten}`;
export const toolchainVolume =
  process.env.PILLAGE_WASM_TOOLCHAIN_VOLUME ?? 'pillage-wasm-toolchain';
export const dockerMounts = [
  '--mount',
  `type=volume,source=${toolchainVolume},target=/toolchain`,
  '--mount',
  `type=bind,source=${packageRoot},target=/package`,
];

export const toolchainEnvironment = () => {
  const [major, minor, patch] = toolchain.sqlite.version.split('.').map(Number);
  const revision = major * 1_000_000 + minor * 10_000 + patch * 100;
  const variables = {
    emscripten_version: toolchain.emscripten,
    hermes_repository: toolchain.hermes.repository,
    hermes_commit: toolchain.hermes.commit,
    sqlite_version: toolchain.sqlite.version,
    sqlite_url: `https://sqlite.org/${toolchain.sqlite.year}/sqlite-amalgamation-${revision}.zip`,
    sqlite_sha256: toolchain.sqlite.sha256,
  };
  return `${Object.entries(variables)
    .map(([key, value]) => `${key}='${value.replaceAll("'", "'\\''")}'`)
    .join('\n')}\n`;
};

export const prepareToolchain = async () => {
  const manifest = z
    .object({
      devDependencies: z.object({ '@sqlite.org/sqlite-wasm': z.string() }),
    })
    .parse(
      JSON.parse(
        await readFile(new URL('../package.json', import.meta.url), 'utf8'),
      ),
    );
  const sqlitePackageVersion =
    manifest.devDependencies['@sqlite.org/sqlite-wasm'];
  if (!sqlitePackageVersion.startsWith(`${toolchain.sqlite.version}-`)) {
    throw new Error(
      'Native SQLite and the benchmark SQLite dependency must use the same version',
    );
  }
  await mkdir(path.join(packageRoot, 'build'), { recursive: true });
  await writeFile(
    path.join(packageRoot, 'build/toolchain.env'),
    toolchainEnvironment(),
  );
};
