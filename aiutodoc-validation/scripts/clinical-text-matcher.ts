export const normalizeText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const CONTROLLED_EQUIVALENTS: Record<string, string[]> = {
  'crescita rallentata': [
    'crescita rallentata',
    'rallentamento della crescita',
    'cresce poco'
  ]
};

export function matchesControlledTerm(value: string, expectedTerm: string): boolean {
  const normalizedValue = normalizeText(value);
  const normalizedExpected = normalizeText(expectedTerm);
  const equivalents = CONTROLLED_EQUIVALENTS[normalizedExpected] || [expectedTerm];
  return equivalents.some((variant) => normalizedValue.includes(normalizeText(variant)));
}

export function matchesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => matchesControlledTerm(value, term));
}
