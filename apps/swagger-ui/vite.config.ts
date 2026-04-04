import { defineConfig } from 'vite';

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  server: {
    open: true,
    port: 5174,
  },
});

export default viteConfig;
