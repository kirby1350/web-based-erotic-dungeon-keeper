import { defineConfig } from '@playwright/test'

const port = Number(process.env.PW_PORT || 3000)

export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.cjs', timeout: 60000, workers: 1,
  use: { baseURL: `http://127.0.0.1:${port}`, channel: 'chrome', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: true, timeout: 120000 },
})
