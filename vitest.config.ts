import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const coverageInclude = [
  'src/App.tsx',
  'src/components/examsCards.tsx',
  'src/components/app-sidebar.tsx',
  'src/components/exams/**/*.{ts,tsx}',
  'src/components/login/**/*.{ts,tsx}',
  'src/pages/ExamsPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/services/auth.service.ts',
  'src/services/exam.service.ts',
  'src/utils/storage.ts',
  'src/utils/file.utils.ts',
  'src/utils/api-error.ts',
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    server: {
      deps: {
        inline: ['react-router', 'react-router-dom'],
      },
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'json-summary'],
      include: coverageInclude,
      exclude: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
