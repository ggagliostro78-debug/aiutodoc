import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const environment = process.env.AIUTODOC_ENV || 'mocked-local';
if (!['mocked-local', 'staging', 'live'].includes(environment)) throw new Error(`AIUTODOC_ENV non valido: ${environment}`);
if (environment === 'staging' && !process.env.AIUTODOC_BASE_URL) throw new Error('AIUTODOC_BASE_URL è obbligatorio in staging.');
const realEngine = environment !== 'mocked-local';
const baseURL = process.env.AIUTODOC_BASE_URL || (environment === 'live' ? 'https://aiutodoc.it' : 'http://127.0.0.1:4173');

export default defineConfig({
  testDir: './tests',
  outputDir: './artifacts/test-results',
  fullyParallel: false,
  workers: 1,
  timeout: realEngine ? 150_000 : 45_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/html-report', open: 'never' }],
    ['json', { outputFile: 'artifacts/playwright-results.json' }]
  ],
  use: {
    baseURL,
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } }
  ],
  webServer: realEngine ? undefined : {
    command: 'npm run dev',
    cwd: path.resolve(__dirname, '..'),
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
