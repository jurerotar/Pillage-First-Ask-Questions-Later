import { defineConfig } from 'vite';

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  server: {
    open: false,
    port: 5174,
  },
});

export default viteConfig;
