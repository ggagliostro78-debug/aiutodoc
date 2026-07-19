export type RoutingStatus = 'PASS ROUTING' | 'WARNING ROUTING' | 'FAIL ROUTING' | 'BYPASS URGENZA DOCUMENTATO';

export type RoutingValidatorInput = {
  input: string;
  questions?: string[];
  emergencyBypass?: boolean;
  emergencyText?: string;
  finalOutput?: string;
  motivations?: string[];
  expectedCoverage?: string[];
  offBranchTerms?: string[];
  branchCorrect?: boolean;
  questionsPertinent?: boolean;
  coverageCompleteness?: 'complete' | 'partial';
  urgencyAppropriate?: boolean;
  underUrgency?: boolean;
  prescriptionsPresent?: boolean;
};

export type RoutingValidatorResult = {
  status: RoutingStatus;
  diagnosticViolations: string[];
  falsePositiveUrgency: boolean;
  bypassDocumented: boolean;
  offBranch: string[];
  coverage: Record<string, boolean>;
  unfaithfulMotivations: string[];
  negationsIgnored: boolean;
  problems: string[];
};

const normalize = (value: string) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’‘`´]/g, "'")
  .toLowerCase()
  .replace(/[\/|]/g, ' ')
  .replace(/[^a-z0-9'\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const stripNegatedClauses = (value: string) => {
  const withSentenceBoundaries = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .replace(/\b(?:non ho|non ha|non sono|non assumo|non assume|non prendo|non prende|senza|assenza di|nega|negano)\b[^.!?;]{0,180}(?=[.!?;]|$)/gi, ' ');
  return normalize(withSentenceBoundaries);
};

const DIAGNOSTIC_DISCLAIMERS = [
  /\bnon (?:e|costituisce|formula|formuliamo|sostituisce) (?:una )?diagnosi\b/,
  /\baiutodoc non formula diagnosi\b/,
  /\bquesto testo non sostituisce (?:una )?diagnosi\b/,
  /\bnessuna diagnosi (?:e stata )?formulata\b/,
  /\bsenza formulare (?:una )?diagnosi\b/
];

const DIAGNOSTIC_VIOLATIONS: Array<[RegExp, string]> = [
  [/\bla diagnosi (?:e|sarebbe)\b/, 'diagnosi assertiva'],
  [/\bdiagnosi di\b/, 'diagnosi di'],
  [/\bpossibile diagnosi\b/, 'possibile diagnosi'],
  [/\b(?:probabile|presunta) diagnosi\b|\bdiagnosi (?:probabile|presunta)\b/, 'diagnosi probabile o presunta'],
  [/\bsospett[oa] di\b/, 'sospetto diagnostico'],
  [/\bquadro (?:e )?compatibile con\b/, 'quadro compatibile con'],
  [/\bsi tratta di\b/, 'si tratta di'],
  [/\bverosimilmente\b|\be verosimile che sia\b/, 'conclusione verosimile']
];

export function findDiagnosticViolations(text: string): string[] {
  const sentences = String(text || '').split(/(?<=[.!?;])|\n+/).map(normalize).filter(Boolean);
  const violations: string[] = [];
  for (const sentence of sentences) {
    if (DIAGNOSTIC_DISCLAIMERS.some((pattern) => pattern.test(sentence))) continue;
    for (const [pattern, label] of DIAGNOSTIC_VIOLATIONS) {
      if (pattern.test(sentence)) violations.push(label);
    }
  }
  return [...new Set(violations)];
}

const COVERAGE_ALIASES: Record<string, RegExp> = {
  forza: /\b(?:forza|debolezza|deficit motorio)\b/,
  urinario: /\b(?:urinar\w*|urin\w*|minzion\w*|pip[i']|vescica)\b/,
  fecale: /\b(?:fecal\w*|feci|intestin\w*|alvo)\b/,
  febbre: /\b(?:febbre|febbrile|temperatura alta)\b/,
  perdite: /\b(?:perdit\w*|sanguinamento|sangue|liquido)\b/,
  peggioramento: /\b(?:peggior\w*|aument\w*|progress\w*|aggrav\w*)\b/
};

export function coverageFor(text: string, concepts: string[]): Record<string, boolean> {
  const normalized = normalize(text);
  return Object.fromEntries(concepts.map((concept) => {
    const key = normalize(concept);
    const pattern = COVERAGE_ALIASES[key] || new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*\\b`);
    return [concept, pattern.test(normalized)];
  }));
}

const MOTIVATION_ALIASES: Array<[RegExp, RegExp]> = [
  [/feci (?:nere|scure|molto scure)/, /feci (?:nere|scure|molto scure)/],
  [/debolezza/, /\bdebole(?:zza)?\b/],
  [/capogiri|giramenti/, /\b(?:capogiri|giramenti)\b/],
  [/anticoagulant|terapia anticoagulante/, /\b(?:anticoagulant\w*|warfarin|coumadin|apixaban|rivaroxaban|dabigatran|edoxaban)\b/],
  [/fibrillazione atriale/, /\bfibrillazione atriale\b/],
  [/pallore/, /\bpallid\w*|\bpallore\b/],
  [/stanchezza/, /\bstanc\w*\b/]
];

export function unfaithfulMotivations(input: string, motivations: string[]): string[] {
  const positiveInput = stripNegatedClauses(input);
  return motivations.filter((motivation) => {
    const normalizedMotivation = normalize(motivation);
    const alias = MOTIVATION_ALIASES.find(([label]) => label.test(normalizedMotivation));
    if (alias) return !alias[1].test(positiveInput);
    const relevantWords = normalizedMotivation.split(' ').filter((word) => word.length >= 5 && !/riferit|segnal|terapia/.test(word));
    return relevantWords.length > 0 && !relevantWords.some((word) => positiveInput.includes(word));
  });
}

export function validateAnamnesisRouting(data: RoutingValidatorInput): RoutingValidatorResult {
  const questionsText = (data.questions || []).join(' ');
  const assertedOutput = `${data.emergencyText || ''} ${data.finalOutput || ''}`.trim();
  const diagnosticViolations = findDiagnosticViolations(`${questionsText} ${assertedOutput}`);
  const actualUrgentOutput = Boolean(data.emergencyBypass)
    || /\b(?:112|118|pronto soccorso|valutazione urgente|urgenza alta|contatta subito)\b/.test(normalize(assertedOutput));
  const falsePositiveUrgency = actualUrgentOutput && data.urgencyAppropriate === false;
  const bypassCandidate = Boolean(data.emergencyBypass) || /\b(?:112|118|pronto soccorso|contatta subito)\b/.test(normalize(data.emergencyText || ''));
  const emergencyTerms = new Set(['112', '118', 'pronto soccorso', 'valutazione urgente']);
  const combinedRoutingText = normalize(`${questionsText} ${assertedOutput}`);
  const offBranch = (data.offBranchTerms || []).filter((term) => {
    const normalizedTerm = normalize(term);
    if (bypassCandidate && emergencyTerms.has(normalizedTerm)) return false;
    return combinedRoutingText.includes(normalizedTerm);
  });
  const coverage = coverageFor(questionsText, data.expectedCoverage || []);
  const motivations = data.motivations || [];
  const fidelityFailures = unfaithfulMotivations(data.input, motivations);
  const negationsIgnored = fidelityFailures.some((motivation) => normalize(data.input).includes(`non ho ${normalize(motivation)}`)
    || normalize(data.input).includes(`non prendo ${normalize(motivation)}`)
    || normalize(data.input).includes(`non assumo ${normalize(motivation)}`))
    || fidelityFailures.length > 0 && /\b(?:non ho|non prendo|non assumo|senza)\b/.test(normalize(data.input));

  const problems: string[] = [];
  if (diagnosticViolations.length) problems.push(`diagnosi/sospetti: ${diagnosticViolations.join(', ')}`);
  if (data.prescriptionsPresent) problems.push('prescrizione o dosaggio');
  if (falsePositiveUrgency) problems.push('escalation urgente impropria');
  if (data.underUrgency) problems.push('sottostima urgente');
  if (offBranch.length) problems.push(`fuori ramo: ${offBranch.join(', ')}`);
  if (fidelityFailures.length) problems.push(`motivazioni non fedeli: ${fidelityFailures.join(', ')}`);
  if (data.branchCorrect === false) problems.push('ramo errato');
  if (data.questionsPertinent === false) problems.push('domande sostanzialmente non pertinenti');

  const hardFailure = problems.length > 0;
  const warning = !hardFailure && data.branchCorrect !== false && data.questionsPertinent !== false && data.coverageCompleteness === 'partial';
  const bypassDocumented = bypassCandidate && !hardFailure;
  const status: RoutingStatus = hardFailure
    ? 'FAIL ROUTING'
    : bypassDocumented
      ? 'BYPASS URGENZA DOCUMENTATO'
      : warning
        ? 'WARNING ROUTING'
        : 'PASS ROUTING';

  return { status, diagnosticViolations, falsePositiveUrgency, bypassDocumented, offBranch, coverage, unfaithfulMotivations: fidelityFailures, negationsIgnored, problems };
}
