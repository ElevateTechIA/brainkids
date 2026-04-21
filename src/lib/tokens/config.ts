export const TOKEN_RULES = {
  welcomeWithoutReferral: 5,
  welcomeWithReferral: 20,
  referrerReward: 5,
} as const;

export type ModuleId = 'sadhana' | 'philosophy';

export const MODULE_COSTS: Record<ModuleId, number> = {
  sadhana: 20,
  philosophy: 20,
};

export const PACKAGES = [
  { id: 'mini', tokens: 10, priceUsd: 10, label: 'Mini' },
  { id: 'familiar', tokens: 25, priceUsd: 22, label: 'Familiar' },
  { id: 'premium', tokens: 50, priceUsd: 40, label: 'Premium' },
  { id: 'mega', tokens: 100, priceUsd: 75, label: 'Mega' },
] as const;

export type PackageId = (typeof PACKAGES)[number]['id'];

export function getPackage(id: string) {
  return PACKAGES.find((p) => p.id === id);
}
