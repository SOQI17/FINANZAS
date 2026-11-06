import { Couple, Transaction, UserProfile } from '../types';

export interface CoupleMember {
  id: string;
  name: string;
}

/**
 * The two members of a couple. Member A owns splitRatioUser1 and member B owns splitRatioUser2.
 */
export interface CoupleMembers {
  a: CoupleMember;
  b: CoupleMember;
}

export function firstName(name: string): string {
  return (name || '').trim().split(/\s+/)[0] || name;
}

export function getCoupleMembers(
  user: UserProfile | null,
  partner: UserProfile | null,
  couple: Couple | null
): CoupleMembers {
  const me: CoupleMember = { id: user?.uid || '', name: user?.displayName || 'Tú' };
  const other: CoupleMember = { id: partner?.uid || '', name: partner?.displayName || 'Pareja' };

  // Alexis & Karla's transactions were always stored with Alexis as user 1
  const myName = me.name.toLowerCase();
  const otherName = other.name.toLowerCase();
  if (myName.includes('alexis') && otherName.includes('karl')) return { a: me, b: other };
  if (myName.includes('karl') && otherName.includes('alexis')) return { a: other, b: me };

  if (couple && user && couple.user2Id === user.uid) return { a: other, b: me };
  return { a: me, b: other };
}

function nameMatches(text: string, member: CoupleMember): boolean {
  const first = firstName(member.name).toLowerCase();
  if (first.length < 3) return false;
  return text.includes(first) || text.includes(first.substring(0, 4));
}

/**
 * Whether member A paid a transaction. paidBy is normally a uid; older transactions and
 * settlements may only carry a name in paidBy/userName.
 */
export function isMemberAPayer(tx: Transaction, m: CoupleMembers): boolean {
  const paidBy = tx.paidBy || '';
  if (m.a.id && paidBy === m.a.id) return true;
  if (m.b.id && paidBy === m.b.id) return false;

  const text = `${tx.userName || ''} ${paidBy}`.toLowerCase();
  const matchesA = nameMatches(text, m.a);
  const matchesB = nameMatches(text, m.b);
  if (matchesA && !matchesB) return true;
  if (matchesB && !matchesA) return false;

  return !(m.b.id && tx.userId === m.b.id);
}

export function isSettlementTx(tx: Transaction): boolean {
  const cat = (tx.category || '').toLowerCase();
  const desc = (tx.description || '').toLowerCase();
  return cat.includes('saldar') || desc.includes('saldado') || desc.includes('settle');
}

/**
 * Returns the share of a transaction that belongs to member A and member B (0..1).
 * splitRatioUser1 is always member A's share and splitRatioUser2 member B's, regardless of who paid.
 */
export function getMemberRatios(tx: Transaction, m: CoupleMembers): { aRatio: number; bRatio: number } {
  const aPaid = isMemberAPayer(tx, m);

  if (tx.scope === 'individual') {
    return aPaid ? { aRatio: 1, bRatio: 0 } : { aRatio: 0, bRatio: 1 };
  }
  if (tx.splitRatioUser1 !== undefined && tx.splitRatioUser2 !== undefined) {
    return { aRatio: tx.splitRatioUser1, bRatio: tx.splitRatioUser2 };
  }

  // Legacy transactions without stored ratios
  if (tx.splitMethod === 'full') {
    return aPaid ? { aRatio: 0, bRatio: 1 } : { aRatio: 1, bRatio: 0 };
  }
  const legacyAShare: Record<string, number> = { '60_40': 0.4, '70_30': 0.3, '80_20': 0.2 };
  const aRatio = legacyAShare[tx.splitMethod] ?? 0.5;
  return { aRatio, bRatio: 1 - aRatio };
}

export function getSplitBadgeText(tx: Transaction, m: CoupleMembers): string {
  if (tx.scope === 'individual') {
    return '100% Personal';
  }
  const { aRatio, bRatio } = getMemberRatios(tx, m);
  const a = Math.round(aRatio * 100);
  const b = Math.round(bRatio * 100);
  if (a === 50 && b === 50) {
    return 'División 50% / 50%';
  }
  if (a === 0) return `100% ${firstName(m.b.name)}`;
  if (b === 0) return `100% ${firstName(m.a.name)}`;
  return `${firstName(m.a.name)} ${a}% • ${firstName(m.b.name)} ${b}%`;
}
