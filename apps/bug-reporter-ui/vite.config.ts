import { defineConfig } from 'vite';

const viteConfig = defineConfig({
  server: {
    open: true,
    port: 5176,
    strictPort: true,
  },
});

export default viteConfig;
