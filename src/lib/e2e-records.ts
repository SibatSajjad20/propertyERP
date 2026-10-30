/** Prefixes Playwright writes. Safe to delete from any environment after dry-run review. */
export const E2E_UNIT_CODE_PATTERN = /^(E2E|ST-\d|RV-\d|SALES-\d)/i;
export const E2E_STRUCTURE_NAME_PATTERN = /^(E2E\b|Archive empty)/i;

export function isE2eUnitCode(code: string): boolean {
  return E2E_UNIT_CODE_PATTERN.test(code.trim());
}

export function isE2eStructureName(name: string): boolean {
  return E2E_STRUCTURE_NAME_PATTERN.test(name.trim());
}
