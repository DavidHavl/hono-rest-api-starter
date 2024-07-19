/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
