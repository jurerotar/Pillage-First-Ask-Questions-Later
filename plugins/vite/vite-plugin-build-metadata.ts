import { randomUUID } from 'node:crypto';
import type { Plugin } from 'vite';

export const buildMetadataPlugin = (version: string): Plugin => {
  const buildId = randomUUID();

  return {
    name: 'pillage-first-build-metadata',
    config: () => ({
      define: {
        'import.meta.env.BUILD_ID': JSON.stringify(buildId),
      },
    }),
    generateBundle() {
      if (this.environment.config.build.ssr) {
        return;
      }

      this.emitFile({
        type: 'asset',
        fileName: 'build.json',
        source: JSON.stringify({ buildId, version }),
      });
    },
  };
};
