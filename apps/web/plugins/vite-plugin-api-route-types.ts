import type { Logger, Plugin } from 'vite';
import {
  apiRouteTypesInputGlobs,
  generateApiRouteTypes,
  isApiRouteTypesInputFile,
  listApiRouteTypesInputFiles,
} from '../../../scripts/generate-api-route-types';

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
    enforce: 'pre',
    configResolved(config) {
      logger = config.logger;
    },
    buildStart() {
      generateApiRouteTypes({ quiet: true });

      for (const file of listApiRouteTypesInputFiles()) {
        this.addWatchFile(file);
      }
    },
    configureServer(server) {
      server.watcher.add(apiRouteTypesInputGlobs);

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
