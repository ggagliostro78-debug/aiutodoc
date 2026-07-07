import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import cases from '../test-cases.json';
import expectedById from '../expected-results.json';
import { buildReport, scoreResult, type CapturedResult, type ExpectedResult } from '../scripts/score-results';

const root = path.resolve(__dirname, '..');
const environment = (process.env.AIUTODOC_ENV || 'mocked-local') as CapturedResult['environment'];
const realEngine = environment !== 'mocked-local';
const ageValues: Record<string, string> = { '3-5': '3_5', '6-12': '6_12', '18-39': '18_39', '40-64': '40_64', '65-74': '65_74', '75+': '75_plus' };
const sexValues: Record<string, string> = { Femmina: 'female', Maschio: 'male' };

function syntheticResult(id: string, expected: ExpectedResult) {
  const urgent = !/non pronto soccorso|non urgente/i.test(expected.urgency) && /alta|urgente|prioritaria/i.test(expected.urgency);
  const specialist = expected.primary.find((x) => !/112|pronto soccorso|urgenza|medico urgente/i.test(x)) || expected.secondary[0] || expected.primary[0];
  return {
    sintesi_anamnestica: `I sintomi descritti richiedono orientamento prudente. Segnali da riferire al medico: ${expected.redFlags.join(', ')}. Non è una diagnosi.`,
    red_flags_rilevate: expected.redFlags,
    specialista_indicato: specialist,
    preparazione_visita: urgent
      ? `Valutazione urgente: contattare subito il 112 o il Pronto Soccorso. ${expected.urgency}`
      : `Parlarne con il medico per una valutazione ${expected.urgency}. ${expected.mustContain?.join(' e ') || ''}`,
    impegnativa_medico: `Valutare i sintomi riferiti e l'eventuale invio a ${specialist}.`
  };
}

async function installMocks(page: Page, testCase: typeof cases[number]) {
  if (realEngine) return;
  const expected = expectedById[testCase.id as keyof typeof expectedById] as ExpectedResult;
  await page.route('**/api/gemini', async (route) => {
    const body = route.request().postDataJSON() as { action?: string };
    if (body?.action === 'validate_symptom') {
      await route.fulfill({ json: { result: { is_medical_request: true, is_possible_emergency: false } } });
      return;
    }
    await route.fulfill({ json: { result: syntheticResult(testCase.id, expected) } });
  });
  await page.route('**/api/{places,specialist-search,triage-save,consent-logs}', async (route) => {
    const url = route.request().url();
    if (url.includes('triage-save')) await route.fulfill({ status: 503, json: { error: 'disabled_in_validation' } });
    else if (url.includes('consent-logs')) await route.fulfill({ status: 204, body: '' });
    else await route.fulfill({ json: { risultati: [], found: false } });
  });
  await page.route('**/api/enrich', (route) => route.fulfill({ json: { risultati: [] } }));
}

async function acceptEntryConsents(page: Page) {
  const ageYes = page.locator('input[name="age-confirmation"][value="yes"]');
  if (await ageYes.isVisible()) {
    await ageYes.check();
    await page.locator('#consent-medical-disclaimer').check();
    await page.locator('#consent-terms').check();
    await page.locator('#consent-health-data').check();
    await page.locator('#accept-privacy-btn').click();
  }
  const rejectCookies = page.locator('#cookie-reject-all');
  if (await rejectCookies.isVisible()) await rejectCookies.click();
}

async function send(page: Page, value: string) {
  const input = page.locator('#user-input');
  await expect(input).toBeVisible();
  await expect(input).toBeEnabled();
  await input.fill(value);
  const sendButton = page.locator('#send-btn');
  await expect(sendButton).toBeEnabled();
  await sendButton.click();
}

async function engineState(page: Page): Promise<string> {
  return page.evaluate(() => (window as any).triageEngine?.state || 'unknown');
}

async function answerChoice(page: Page, value: 'C' | 'No') {
  const choice = value === 'C'
    ? page.locator('.mcq-options:not(.is-locked) .mcq-option[data-reply^="C)"]')
    : page.locator('.detail-choice-actions:not(.is-locked) .detail-choice-btn[data-reply="No"]');
  await expect(choice).toBeVisible();
  await expect(choice).toBeEnabled();
  await choice.click();
}

async function completeInterview(page: Page) {
  for (let step = 0; step < 20; step++) {
    const state = await engineState(page);
    if (state === '7_FINE') return;
    if (state === '4_CONOSCITIVE' || state === '5_ANAMNESTICHE') await answerChoice(page, 'C');
    else if (state === '4B_NOTA_CONOSCITIVA_SCELTA' || state === '5B_NOTA_ANAMNESTICA_SCELTA') await answerChoice(page, 'No');
    else if (state === '5C_DETTAGLIO_CONDIZIONATO') {
      const placeholder = await page.locator('#user-input').getAttribute('placeholder') || '';
      const value = /peso/i.test(placeholder) ? '70' : /altezza/i.test(placeholder) ? '170' : /età|eta/i.test(placeholder) ? '35' : 'No';
      await send(page, value);
    }
    else if (state === '6_RICERCA_SCIENTIFICA') {
      await expect(page.getByTestId('aiutodoc-output')).toBeVisible({ timeout: realEngine ? 120_000 : 20_000 });
      return;
    }
    else return;
  }
  throw new Error(`Intervista non terminata; stato: ${await engineState(page)}`);
}

test.describe('Validazione clinico-funzionale AIutoDoc', () => {
  for (const testCase of cases) {
    test(`${testCase.id} - orientamento e sicurezza`, async ({ page }, testInfo) => {
      await installMocks(page, testCase);
      await page.goto('/');
      if (!realEngine) {
        await page.evaluate(() => {
          (window as any).triageEngine._waitForMinimumResearchTime = async () => undefined;
        });
      }
      await acceptEntryConsents(page);

      await page.locator(`input[name="age_range"][value="${ageValues[testCase.age_band]}"]`).check();
      await page.locator(`input[name="sex_at_birth"][value="${sexValues[testCase.sex]}"]`).check();
      await page.locator('#initial-medical-form button[type="submit"]').click();
      await send(page, 'Italia');
      await send(page, testCase.input);

      const clinicalEmergency = page.getByTestId('clinical-emergency-output');
      const randomRejection = page.getByText(/descrizione inserita non è valida.*casualmente/i);
      await expect.poll(async () => ({
        state: await engineState(page),
        emergency: await clinicalEmergency.count(),
        rejected: await randomRejection.count()
      })).not.toEqual({ state: '3_DISTURBO', emergency: 0, rejected: 0 });
      const hasClinicalEmergency = await clinicalEmergency.count() > 0;
      const inputRejected = await randomRejection.count() > 0;
      if (!hasClinicalEmergency && !inputRejected) await completeInterview(page);

      const outputLocator = hasClinicalEmergency
        ? clinicalEmergency
        : inputRejected
          ? randomRejection
          : page.getByTestId('aiutodoc-output');
      await expect(outputLocator).toBeVisible({ timeout: realEngine ? 120_000 : 20_000 });
      const output = (await outputLocator.innerText()).trim();
      const specialist = hasClinicalEmergency || inputRejected ? '' : (await page.getByTestId('specialist-output').innerText()).trim();
      const urgency = hasClinicalEmergency ? (await clinicalEmergency.innerText()).trim() : inputRejected ? '' : (await page.getByTestId('urgency-output').innerText()).trim();
      const redFlagsText = hasClinicalEmergency ? output : inputRejected ? '' : (await page.getByTestId('red-flags-output').innerText()).trim();
      const disclaimer = (await page.getByTestId('medical-disclaimer').first().innerText()).trim();
      const sources = hasClinicalEmergency || inputRejected ? '' : (await page.getByTestId('orientation-sources').innerText()).trim();
      const questionCount = await page.getByTestId('orientation-question').count();

      if (['CELIACHIA_02', 'INFLUENZA_02', 'COVID_02'].includes(testCase.id)) {
        expect(inputRejected, `${testCase.id} non deve essere respinto come testo casuale`).toBe(false);
      }
      if (['INFLUENZA_02', 'COVID_02'].includes(testCase.id)) {
        expect(hasClinicalEmergency, `${testCase.id} deve produrre un segnale clinico d'urgenza distinto`).toBe(true);
      }

      const screenshotDir = path.join(root, 'artifacts', 'screenshots');
      const rawDir = path.join(root, 'artifacts', 'raw-output');
      fs.mkdirSync(screenshotDir, { recursive: true });
      fs.mkdirSync(rawDir, { recursive: true });
      const screenshotName = `${environment}-${testInfo.project.name}-${testCase.id}.png`;
      await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: true });

      const captured: CapturedResult = {
        id: testCase.id, input: testCase.input, output, specialist, urgency, redFlagsText,
        disclaimer, sources, clinicalEmergency: hasClinicalEmergency ? output : '',
        urgencyReason: hasClinicalEmergency ? output : urgency, questionCount,
        url: page.url(), environment, timestamp: new Date().toISOString(),
        screenshot: `../artifacts/screenshots/${screenshotName}`
      };
      fs.writeFileSync(path.join(rawDir, `${environment}-${testInfo.project.name}-${testCase.id}.json`), JSON.stringify(captured, null, 2));
      const expected = expectedById[testCase.id as keyof typeof expectedById] as ExpectedResult;
      const score = scoreResult(captured, expected);
      await testInfo.attach('output-aiutodoc', { body: output, contentType: 'text/plain' });
      await testInfo.attach('score', { body: JSON.stringify(score, null, 2), contentType: 'application/json' });

      expect(score.criticalErrors, score.criticalErrors.join('; ')).toEqual([]);
      expect(score.total).toBeGreaterThanOrEqual(6);
    });
  }

  test.afterAll(() => {
    const rawDir = path.join(root, 'artifacts', 'raw-output');
    const results: CapturedResult[] = fs.existsSync(rawDir)
      ? fs.readdirSync(rawDir).filter((name) => name.endsWith('.json')).map((name) => JSON.parse(fs.readFileSync(path.join(rawDir, name), 'utf8')))
      : [];
    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(path.join(root, 'reports', 'technical-ui-flow-report.md'), buildReport(results, expectedById as Record<string, ExpectedResult>, 'technical'));
    fs.writeFileSync(path.join(root, 'reports', 'clinical-functional-report.md'), buildReport(results, expectedById as Record<string, ExpectedResult>, 'clinical'));
  });
});
