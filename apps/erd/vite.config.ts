import path from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  resolve: {
    alias: {
      react: path.resolve(import.meta.dirname, '../../node_modules/react'),
      'react-dom': path.resolve(
        import.meta.dirname,
        '../../node_modules/react-dom',
      ),
    },
  },
  server: {
    open: true,
    port: 5175,
  },
});

export default viteConfig;
