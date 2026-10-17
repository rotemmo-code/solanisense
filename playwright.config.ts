import { defineConfig, devices } from '@playwright/test';

// webServer.port also sets the base URL to http://localhost:5173
export default defineConfig({
  testDir: 'e2e',
  use: { locale: 'he-IL', permissions: [] }, // no camera permission, so the upload path is what gets tested
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev', port: 5173, reuseExistingServer: true },
});
