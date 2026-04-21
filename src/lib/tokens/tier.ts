import { colors } from '@/lib/theme/colors';

export type TokenTier = 'copper' | 'silver' | 'gold';

export function getTokenTier(balance: number): TokenTier {
  if (balance >= 100) return 'gold';
  if (balance >= 10) return 'silver';
  return 'copper';
}

export function getTierColors(tier: TokenTier) {
  switch (tier) {
    case 'gold':
      return { main: colors.tokenGold, light: colors.tokenGoldLight };
    case 'silver':
      return { main: colors.tokenSilver, light: colors.tokenSilverLight };
    case 'copper':
      return { main: colors.tokenCopper, light: colors.tokenCopperLight };
  }
}
