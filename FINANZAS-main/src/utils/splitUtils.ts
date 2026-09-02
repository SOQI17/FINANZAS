import { Transaction } from '../types';

export function getSplitBadgeText(tx: Transaction): string {
  if (tx.splitMethod === '50_50') return 'División 50/50';
  if (tx.splitMethod === '60_40') return 'División 60% / 40%';
  if (tx.splitMethod === '70_30') return 'División 70% / 30%';
  if (tx.splitMethod === '80_20') return 'División 80% / 20%';
  if (tx.splitMethod === 'full') return '100% Pareja';
  if (tx.splitMethod === 'custom_percentage' || tx.splitMethod === 'custom') {
    const u1 = Math.round((tx.splitRatioUser1 ?? 0.5) * 100);
    const u2 = Math.round((tx.splitRatioUser2 ?? 0.5) * 100);
    return `División ${u1}% / ${u2}%`;
  }
  return 'División Personalizada';
}
