import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'build', 'dist', '.openapi-nodegen'],
    coverage: {
      include: [
        'src/domains/**/*.ts',
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@database': path.resolve(__dirname, 'src/database'),
      '@domains': path.resolve(__dirname, 'src/domains'),
      '@http': path.resolve(__dirname, 'src/http'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
