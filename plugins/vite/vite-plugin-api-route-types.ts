import type { Logger, Plugin } from 'vite';
import {
  apiRouteTypesInputGlobs,
  generateApiRouteTypes,
  isApiRouteTypesInputFile,
  listApiRouteTypesInputFiles,
} from '../../scripts/generate-api-route-types.ts';

export const apiRouteTypesPlugin = (): Plugin => {
  let pendingRegeneration: NodeJS.Timeout | undefined;
  let logger: Logger | undefined;

  const regenerate = (source: string) => {
    if (pendingRegeneration) {
      clearTimeout(pendingRegeneration);
    }

    pendingRegeneration = setTimeout(() => {
      pendingRegeneration = undefined;

      try {
        const { changed, outputPath } = generateApiRouteTypes({ quiet: true });

        if (changed) {
          logger?.info(
            `[api-route-types] regenerated ${outputPath} after ${source}`,
          );
        }
      } catch (error) {
        logger?.error('[api-route-types] failed to regenerate route types');
        logger?.error(error instanceof Error ? error.message : String(error));
      }
    }, 50);
  };

  return {
    name: 'pillage-first-api-route-types',
    // CI and type-check scripts generate these declarations before checking types.
    apply: 'serve',
    enforce: 'pre',
    configResolved(config) {
      ({ logger } = config);
    },
    configureServer(server) {
      // React Router omits this hook from its internal build-time compiler.
      generateApiRouteTypes({ quiet: true });
      server.watcher.add([
        ...apiRouteTypesInputGlobs,
        ...listApiRouteTypesInputFiles(),
      ]);

      const handleFileChange = (file: string) => {
        if (isApiRouteTypesInputFile(file)) {
          regenerate(file);
        }
      };

      server.watcher.on('add', handleFileChange);
      server.watcher.on('change', handleFileChange);
      server.watcher.on('unlink', handleFileChange);
    },
  };
};
