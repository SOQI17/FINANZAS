import { Transaction } from '../types';

export function getSplitBadgeText(tx: Transaction): string {
  const paidByClean = (tx.paidBy || tx.userName || '').toLowerCase();
  const isAlexisPayer = paidByClean.includes('alexis');

  if (tx.splitMethod === '50_50') {
    return 'División 50% / 50%';
  }
  if (tx.splitMethod === '60_40') {
    return isAlexisPayer ? 'Alexis 40% • Karlita 60%' : 'Karlita 60% • Alexis 40%';
  }
  if (tx.splitMethod === '70_30') {
    return isAlexisPayer ? 'Alexis 30% • Karlita 70%' : 'Karlita 70% • Alexis 30%';
  }
  if (tx.splitMethod === '80_20') {
    return isAlexisPayer ? 'Alexis 20% • Karlita 80%' : 'Karlita 80% • Alexis 20%';
  }
  if (tx.splitMethod === 'full') {
    return isAlexisPayer ? '100% Karlita' : '100% Alexis';
  }
  if (tx.splitMethod === 'custom_percentage' || tx.splitMethod === 'custom') {
    const u1 = Math.round((tx.splitRatioUser1 ?? 0.5) * 100);
    const u2 = Math.round((tx.splitRatioUser2 ?? 0.5) * 100);
    return `Alexis ${u1}% • Karlita ${u2}%`;
  }
  return 'División 50% / 50%';
}
