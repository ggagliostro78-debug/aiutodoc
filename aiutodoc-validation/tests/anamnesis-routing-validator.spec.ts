import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import fixtures from '../fixtures/anamnesis-routing-validator.json';
import { validateAnamnesisRouting, type RoutingValidatorInput } from '../scripts/anamnesis-routing-validator';

const root = path.resolve(__dirname, '..');
const resultsPath = path.join(root, 'artifacts', 'anamnesis-routing-validator-results.json');
const results: Array<{ id: string; expected: unknown; obtained: unknown; pass: boolean }> = [];

function loadFixture(fixture: typeof fixtures[number]): RoutingValidatorInput {
  const base = fixture.data as RoutingValidatorInput;
  if (!('sourceRaw' in fixture) || !fixture.sourceRaw) return base;
  const raw = JSON.parse(fs.readFileSync(path.resolve(root, 'fixtures', fixture.sourceRaw), 'utf8'));
  const emergencyText = raw.emergencyText || raw.clinicalEmergency || '';
  const motivations = emergencyText
    ? emergencyText.split(/Motivazione dell'urgenza:/i)[1]?.split(/\r?\n/).map((value: string) => value.trim()).filter((value: string) => value && !/^\d{1,2}:\d{2}$/.test(value)) || []
    : [];
  return {
    ...base,
    input: raw.input || '',
    questions: raw.questions || [],
    emergencyBypass: Boolean(raw.emergencyBypass || raw.clinicalEmergency),
    emergencyText,
    finalOutput: raw.output || '',
    motivations
  };
}

test.describe('Validatore routing anamnestico', () => {
  for (const fixture of fixtures) {
    test(fixture.id, () => {
      const obtained = validateAnamnesisRouting(loadFixture(fixture));
      const expected = fixture.expected as Record<string, unknown>;
      let pass = true;
      try {
        if (expected.status !== undefined) expect(obtained.status).toBe(expected.status);
        if (expected.diagnosticViolations !== undefined) expect(obtained.diagnosticViolations).toHaveLength(Number(expected.diagnosticViolations));
        if (expected.falsePositiveUrgency !== undefined) expect(obtained.falsePositiveUrgency).toBe(expected.falsePositiveUrgency);
        if (expected.bypassDocumented !== undefined) expect(obtained.bypassDocumented).toBe(expected.bypassDocumented);
        if (expected.offBranch !== undefined) expect(obtained.offBranch).toHaveLength(Number(expected.offBranch));
        if (expected.unfaithfulMotivations !== undefined) expect(obtained.unfaithfulMotivations).toHaveLength(Number(expected.unfaithfulMotivations));
        if (expected.negationsIgnored !== undefined) expect(obtained.negationsIgnored).toBe(expected.negationsIgnored);
        if (expected.coverage !== undefined) expect(obtained.coverage).toMatchObject(expected.coverage as Record<string, boolean>);
      } catch (error) {
        pass = false;
        throw error;
      } finally {
        results.push({ id: fixture.id, expected, obtained, pass });
      }
    });
  }

  test.afterAll(() => {
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify({ generatedAt: new Date().toISOString(), total: results.length, passed: results.filter((item) => item.pass).length, failed: results.filter((item) => !item.pass).length, results }, null, 2));
  });
});
