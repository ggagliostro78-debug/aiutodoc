import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { matchesControlledTerm } from '../scripts/clinical-text-matcher';

test('validatore sinonimi crescita - CELIACHIA_02 raw salvato', () => {
  const rawPath = path.resolve(__dirname, '../artifacts/raw-output/staging-chromium-desktop-CELIACHIA_02.json');
  const captured = JSON.parse(fs.readFileSync(rawPath, 'utf8')) as { redFlagsText?: string };
  const indicators = captured.redFlagsText || '';

  expect(matchesControlledTerm(indicators, 'crescita rallentata')).toBe(true);
  expect(matchesControlledTerm(indicators, 'stanchezza cronica')).toBe(true);
  expect(matchesControlledTerm(indicators, 'dolore addominale')).toBe(true);
  expect(matchesControlledTerm(indicators, 'feci molli')).toBe(true);
  expect(matchesControlledTerm(indicators, 'familiarit')).toBe(true);

  expect(matchesControlledTerm('Stanchezza cronica e dolore addominale ricorrente', 'crescita rallentata')).toBe(false);
});
