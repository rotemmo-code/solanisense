import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'], // e2e/*.spec.ts belong to Playwright
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
    },
  }),
);
