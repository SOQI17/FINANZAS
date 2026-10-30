import { Transaction } from '../types';

/**
 * Detects whether Alexis paid a transaction.
 * userName holds the payer's display name; paidBy is usually a uid (or a name for settlements).
 */
export function isAlexisPayer(tx: Transaction): boolean {
  const name = (tx.userName || '').toLowerCase();
  const paidBy = (tx.paidBy || '').toLowerCase();
  if (name.includes('alexis') || paidBy.includes('alexis')) return true;
  if (name.includes('karla') || name.includes('karlita') || paidBy.includes('karla') || paidBy.includes('karlita')) return false;
  return true;
}

export function isSettlementTx(tx: Transaction): boolean {
  const cat = (tx.category || '').toLowerCase();
  const desc = (tx.description || '').toLowerCase();
  return cat.includes('saldar') || desc.includes('saldado') || desc.includes('settle');
}

/**
 * Returns the share of a transaction that belongs to Alexis and to Karla (0..1).
 * splitRatioUser1 is always Alexis's share and splitRatioUser2 Karla's, regardless of who paid.
 */
export function getMemberRatios(tx: Transaction): { alexisRatio: number; karlaRatio: number } {
  const alexisPaid = isAlexisPayer(tx);

  if (tx.scope === 'individual') {
    return alexisPaid ? { alexisRatio: 1, karlaRatio: 0 } : { alexisRatio: 0, karlaRatio: 1 };
  }
  if (tx.splitRatioUser1 !== undefined && tx.splitRatioUser2 !== undefined) {
    return { alexisRatio: tx.splitRatioUser1, karlaRatio: tx.splitRatioUser2 };
  }

  // Legacy transactions without stored ratios
  if (tx.splitMethod === 'full') {
    return alexisPaid ? { alexisRatio: 0, karlaRatio: 1 } : { alexisRatio: 1, karlaRatio: 0 };
  }
  const legacyAlexisShare: Record<string, number> = { '60_40': 0.4, '70_30': 0.3, '80_20': 0.2 };
  const alexisRatio = legacyAlexisShare[tx.splitMethod] ?? 0.5;
  return { alexisRatio, karlaRatio: 1 - alexisRatio };
}

export function getSplitBadgeText(tx: Transaction): string {
  if (tx.scope === 'individual') {
    return '100% Personal';
  }
  const { alexisRatio, karlaRatio } = getMemberRatios(tx);
  const a = Math.round(alexisRatio * 100);
  const k = Math.round(karlaRatio * 100);
  if (a === 50 && k === 50) {
    return 'División 50% / 50%';
  }
  if (a === 0) return '100% Karlita';
  if (k === 0) return '100% Alexis';
  return `Alexis ${a}% • Karlita ${k}%`;
}
