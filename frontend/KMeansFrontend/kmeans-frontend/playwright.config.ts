import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './end-to-end-test-klaudia',   // katalog z TS testami
  testMatch: '**/*.spec.ts',    // łapie wszystkie TS testy
  timeout: 30000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});
