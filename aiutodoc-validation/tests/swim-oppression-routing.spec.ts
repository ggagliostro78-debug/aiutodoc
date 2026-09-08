import { test, expect, type Page } from '@playwright/test';

const cases = [
  {
    id: 'BASE',
    input: "Da mesi/anni, mentre nuoto in piscina, sento una sensazione di oppressione e il desiderio di uscire dall'acqua. Il problema compare gradualmente ma sta peggiorando. Ho inoltre difficolta solo nell'addormentamento.",
    answers: [
      "Non so localizzare l'oppressione e non so descriverla meglio.",
      "Non ho riferito dolore al petto, fame d'aria, tosse, sibili, palpitazioni, vertigini, sudorazione, nausea o svenimento.",
      "Non so se accade durante altri sforzi; sento il desiderio di uscire dall'acqua."
    ],
    profile: 'ambiguous',
    specialist: /Medico di Medicina Generale|Internista/i,
    urgency: /programmata a breve/i
  },
  {
    id: 'TEST_1_AMBIGUO',
    input: "Sento oppressione mentre nuoto e voglio uscire dall'acqua. Non so descriverla meglio.",
    answers: [
      "Non so indicare se riguarda petto, gola, respiro o una sensazione emotiva.",
      "Non so riferire altri sintomi associati.",
      "Non so se succede durante altri sforzi o solo in acqua."
    ],
    profile: 'ambiguous',
    specialist: /Medico di Medicina Generale|Internista/i,
    urgency: /programmata a breve/i
  },
  {
    id: 'TEST_2_CARDIO',
    input: "Durante il nuoto sento peso al centro del petto, affanno e capogiro. Succede anche salendo le scale.",
    answers: [
      "Il peso e al centro del petto durante lo sforzo.",
      "Sono presenti affanno e capogiro; non ho riferito perdita di coscienza.",
      "Accade anche salendo le scale."
    ],
    profile: 'cardiac',
    specialist: /Cardiologo/i,
    urgency: /prioritaria|non da rimandare/i
  },
  {
    id: 'TEST_3_RESPIRATORIO',
    input: "Durante il nuoto mi manca l'aria, tossisco e sento un fischio nel respiro. Nessun dolore al petto e nessuna paura.",
    answers: [
      "La difficolta respiratoria compare durante il nuoto con tosse e fischio.",
      "Non ho dolore al petto.",
      "Non provo paura o panico."
    ],
    profile: 'respiratory',
    specialist: /Pneumologo|Medico dello Sport/i,
    urgency: /prioritaria|non da rimandare/i
  },
  {
    id: 'TEST_4_ANSIA',
    input: "In acqua profonda sento paura intensa, il cuore accelera e devo uscire subito. Fuori dall'acqua sto bene, corro senza problemi e non ho dolore al petto ne vera mancanza d'aria.",
    answers: [
      "Succede solo in acqua profonda e provo paura intensa con bisogno urgente di uscire.",
      "Fuori dall'acqua corro senza problemi.",
      "Non ho dolore al petto, vera mancanza d'aria o svenimenti."
    ],
    profile: 'anxiety',
    specialist: /Psicologo|Psicoterapeuta/i,
    urgency: /bassa|programmata/i
  },
  {
    id: 'TEST_5_ADDORMENTAMENTO',
    input: "Ho difficolta ad addormentarmi, ma nessun disturbo durante il nuoto o altri sforzi.",
    answers: [
      "La difficolta riguarda solo l'addormentamento.",
      "Non ho disturbi durante il nuoto o altri sforzi.",
      "Non ho riferito dolore toracico, dispnea, svenimenti o altri segnali acuti."
    ],
    profile: '',
    specialist: /Medico di Medicina Generale/i,
    urgency: /non urgente|programmata/i
  },
  {
    id: 'TEST_6_RED_FLAG',
    input: "Durante il nuoto compare forte dolore al petto con quasi svenimento e grave difficolta respiratoria.",
    answers: [],
    profile: 'emergency',
    specialist: /emergenza|Pronto Soccorso/i,
    urgency: /Emergenza|112\/118|Pronto Soccorso/i
  }
];

const neutralResult = {
  sintesi_anamnestica: 'Sintomi riferiti da orientare senza diagnosi.',
  specialista_indicato: 'Medico di Medicina Generale',
  livello_urgenza: 'Non urgente / visita programmata a breve',
  area_specialistica_piu_adatta: {
    branca: 'Medicina generale',
    area_specialistica: 'Primo inquadramento',
    eventuale_secondo_livello: 'Da definire'
  },
  preparazione_visita: 'Riferire i sintomi al medico.',
  impegnativa_medico: 'Valutazione dei sintomi riferiti.',
  red_flags_rilevate: []
};

test.describe('Micro-validazione oppressione durante il nuoto', () => {
  for (const testCase of cases) {
    test(`${testCase.id} - domande, routing e sicurezza`, async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(() => (window as any).triageEngine);
      const obtained = await page.evaluate(({ testCase, neutralResult }) => {
        const engine = (window as any).triageEngine;
        const questions = engine._generaDomandeAnamnestiche(testCase.input);
        engine.userData = {
          ...engine.userData,
          age_range: '40_64',
          sex_at_birth: 'male',
          zona: 'Italia',
          disturbo: testCase.input,
          conoscitiveResp: [],
          anamnesticheResp: testCase.answers,
          notaConoscitiva: 'Nessuna nota aggiuntiva',
          notaAnamnestica: 'Nessun dettaglio aggiuntivo anamnestico fornito.'
        };
        const profile = engine._getSwimmingSymptomProfile();
        const urgencySignals = engine._detectUrgencySignals(testCase.input);
        const result = urgencySignals.length
          ? engine._sanitizeResultForUser(engine._buildLocalEmergencyStructuredData(testCase.input, urgencySignals))
          : engine._normalizeGeminiResult(neutralResult);
        return { questions, profile, urgencySignals, result };
      }, { testCase, neutralResult });

      expect(obtained.profile).toBe(testCase.profile);
      expect(obtained.result.specialista_indicato).toMatch(testCase.specialist);
      expect(obtained.result.livello_urgenza).toMatch(testCase.urgency);

      const questions = obtained.questions.join(' ');
      if (testCase.profile) {
        expect(questions).toContain('Dove avverti esattamente');
        expect(questions).toContain('Quali sintomi compaiono');
        expect(questions).toContain('In quali altre situazioni');
      } else {
        expect(questions).not.toContain('Dove avverti esattamente');
      }

      const output = JSON.stringify(obtained.result).toLowerCase();
      expect(output).not.toMatch(/\bdiagnosi di\b|\bprobabile diagnosi\b|\bpresunta diagnosi\b|\bcompatibile con\b|\bsospett[oa] di\b|\bsi tratta di\b/);
      expect(output).not.toMatch(/\b(?:assumi|prendi|inizia|sospendi)\b[^.!?]{0,60}\b(?:farmaco|terapia|mg|compress)/);
      if (testCase.id === 'TEST_3_RESPIRATORIO') {
        expect(output).toContain('assenza');
        expect(output).not.toMatch(/cardiolog/);
      }
      if (testCase.id === 'TEST_4_ANSIA') {
        expect(output).toContain('assenza riferita di dolore toracico');
        expect(output).not.toMatch(/cardiolog/);
      }
      if (testCase.id === 'TEST_6_RED_FLAG') {
        expect(obtained.urgencySignals.length).toBeGreaterThan(0);
      }
    });
  }

  test('il caso base mostra le domande discriminanti nel flusso UI', async ({ page }) => {
    await page.route('**/api/gemini', async (route) => {
      const body = route.request().postDataJSON() as { action?: string };
      if (body?.action === 'validate_symptom') {
        await route.fulfill({ json: { result: { is_medical_request: true, is_possible_emergency: false } } });
        return;
      }
      await route.fulfill({ json: { result: neutralResult } });
    });
    await page.goto('/');
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

    await page.locator('input[name="age_range"][value="40_64"]').check();
    await page.locator('input[name="sex_at_birth"][value="male"]').check();
    await page.locator('#initial-medical-form button[type="submit"]').click();
    await send(page, 'Italia');
    await send(page, cases[0].input);
    for (let index = 0; index < 3; index++) {
      const choice = page.locator('.mcq-options:not(.is-locked) .mcq-option[data-reply^="C)"]');
      await expect(choice).toBeVisible();
      await choice.click();
    }
    const noDetails = page.locator('.detail-choice-actions:not(.is-locked) .detail-choice-btn[data-reply="No"]');
    await expect(noDetails).toBeVisible();
    await noDetails.click();

    const chat = page.locator('#chat-messages');
    await expect(chat).toContainText("Dove avverti esattamente l'oppressione");
    await expect(chat).toContainText('Al petto o al torace');
    await expect(chat).not.toContainText('Il problema principale');
  });
});

async function send(page: Page, value: string) {
  const input = page.locator('#user-input');
  await expect(input).toBeVisible();
  await expect(input).toBeEnabled();
  await input.fill(value);
  await page.locator('#send-btn').click();
}
