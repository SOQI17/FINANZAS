import { Transaction, Budget, FinancialInsight, FinancialMetrics } from '../types';
import { CoupleMembers, getMemberRatios, isMemberAPayer, isSettlementTx } from '../utils/splitUtils';

export function generateFinancialInsights(
  transactions: Transaction[],
  budgets: Budget[],
  metrics: FinancialMetrics
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // 1. Budget Alerts (> 80% or > 100%)
  const currentMonthExpensesByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      currentMonthExpensesByCategory[t.category] = (currentMonthExpensesByCategory[t.category] || 0) + t.amount;
    });

  budgets.forEach(budget => {
    const spent = currentMonthExpensesByCategory[budget.category] || 0;
    const percentage = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;

    if (percentage >= 100) {
      insights.push({
        id: `budget_over_${budget.budgetId}`,
        title: `Límite Excedido: ${budget.category}`,
        description: `Has gastado $${spent.toFixed(2)} de tu límite de $${budget.limitAmount.toFixed(2)} (${percentage.toFixed(0)}%). Considera reducir gastos no esenciales en esta categoría.`,
        severity: 'high',
        category: 'budget_alert',
        categoryName: budget.category,
        impactAmount: spent - budget.limitAmount,
        actionText: 'Ajustar Presupuesto',
        actionType: 'adjust_budget',
      });
    } else if (percentage >= 80) {
      insights.push({
        id: `budget_warn_${budget.budgetId}`,
        title: `Cerca del Límite: ${budget.category}`,
        description: `Has consumido el ${percentage.toFixed(0)}% ($${spent.toFixed(2)} de $${budget.limitAmount.toFixed(2)}) de tu presupuesto mensual. Te quedan $${(budget.limitAmount - spent).toFixed(2)}.`,
        severity: 'medium',
        category: 'budget_alert',
        categoryName: budget.category,
        impactAmount: budget.limitAmount - spent,
        actionText: 'Ver Categoria',
        actionType: 'view_category',
      });
    }
  });

  // 2. Gastos Hormiga & Unusual Expenses (> 20% variation or small repetitive coffee/dining)
  const coffeeDiningExpenses = transactions.filter(
    t => t.type === 'expense' && (t.category.includes('Restaurantes') || t.category.includes('Café') || t.category.includes('Entretenimiento'))
  );
  const diningTotal = coffeeDiningExpenses.reduce((sum, t) => sum + t.amount, 0);

  if (diningTotal > 150) {
    insights.push({
      id: 'insight_gastos_hormiga_dining',
      title: 'Gastos Hormiga en Restaurantes y Salidas',
      description: `Has gastado $${diningTotal.toFixed(2)} en salidas y cafeterías este mes. Cocinar 2 días más por semana podría ahorrarte aproximadamente $${(diningTotal * 0.35).toFixed(2)} al mes.`,
      severity: 'medium',
      category: 'unusual_expense',
      categoryName: 'Restaurantes y Cafés',
      impactAmount: diningTotal * 0.35,
      actionText: 'Revisar Transacciones',
      actionType: 'review_transactions',
    });
  }

  // 3. Tasa de Ahorro Evaluation
  if (metrics.totalIncome > 0) {
    if (metrics.savingsRate < 10) {
      const targetSavings = metrics.totalIncome * 0.20;
      const shortfall = targetSavings - metrics.savingsAmount;
      insights.push({
        id: 'insight_savings_low',
        title: 'Tasa de Ahorro Crítica (<10%)',
        description: `Tu tasa de ahorro actual es de ${metrics.savingsRate.toFixed(1)}%. Para alcanzar la meta recomendada del 20% ($${targetSavings.toFixed(2)}), reduce tus gastos variables en $${shortfall.toFixed(2)}.`,
        severity: 'high',
        category: 'savings_opportunity',
        impactAmount: shortfall,
        actionText: 'Ajustar Presupuesto',
        actionType: 'adjust_budget',
      });
    } else if (metrics.savingsRate >= 25) {
      insights.push({
        id: 'insight_savings_excellent',
        title: '¡Excelente Tasa de Ahorro! (≥25%)',
        description: `Felicidades, estás ahorrando el ${metrics.savingsRate.toFixed(1)}% de tus ingresos ($${metrics.savingsAmount.toFixed(2)}). Considera destinar un excedente a tu fondo de inversión o de ahorro compartido.`,
        severity: 'success',
        category: 'positive_trend',
        impactAmount: metrics.savingsAmount,
      });
    }
  }

  // 4. Default baseline insights if list is short
  if (insights.length === 0) {
    insights.push({
      id: 'insight_balanced',
      title: 'Finanzas Saludables',
      description: 'Tus gastos se mantienen dentro de los presupuestos establecidos y no se han detectado variaciones inusuales.',
      severity: 'success',
      category: 'positive_trend',
    });
  }

  return insights;
}

export function calculateSharedDebtBalance(
  transactions: Transaction[],
  members: CoupleMembers
): {
  netAmount: number;
  debtorId: string | null;
  creditorId: string | null;
  debtorName: string;
  creditorName: string;
  amountOwed: number;
  isBalanced: boolean;
} {
  let aPaidTotal = 0;
  let aShareTotal = 0;
  // Money already transferred between members to settle debt
  let bPaidToA = 0;
  let aPaidToB = 0;

  transactions
    .filter(t => t.scope === 'shared' && t.approvalStatus !== 'pending' && t.approvalStatus !== 'rejected')
    .forEach(t => {
      const amount = t.amount;
      const aPaid = isMemberAPayer(t, members);

      // Settlement transactions: track them separately so they reduce the NET debt directly
      if (isSettlementTx(t)) {
        if (aPaid) {
          aPaidToB += amount;
        } else {
          bPaidToA += amount;
        }
        return; // Don't count settlement in normal paid/share totals
      }

      if (t.type !== 'expense') return;

      if (aPaid) {
        aPaidTotal += amount;
      }
      aShareTotal += amount * getMemberRatios(t, members).aRatio;
    });

  // aNet > 0 means A paid more than their share → B owes A
  // aNet < 0 means B paid more than their share → A owes B
  const aNet = aPaidTotal - aShareTotal;

  // Apply settlements: B paying A reduces positive debt, A paying B reduces negative debt
  const adjustedNet = aNet - bPaidToA + aPaidToB;
  const netOwed = Math.round(adjustedNet * 100) / 100;

  let debtorId: string | null = null;
  let creditorId: string | null = null;
  let debtorName = '';
  let creditorName = '';
  let amountOwed = Math.abs(netOwed);
  let isBalanced = false;

  if (Math.abs(netOwed) < 0.01) {
    isBalanced = true;
    amountOwed = 0;
  } else if (netOwed > 0) {
    debtorName = members.b.name;
    creditorName = members.a.name;
    debtorId = members.b.id;
    creditorId = members.a.id;
  } else {
    debtorName = members.a.name;
    creditorName = members.b.name;
    debtorId = members.a.id;
    creditorId = members.b.id;
  }

  return {
    netAmount: netOwed,
    debtorId,
    creditorId,
    debtorName,
    creditorName,
    amountOwed,
    isBalanced,
  };
}

export interface SharedDebtBreakdownItem {
  transaction: Transaction;
  kind: 'expense' | 'settlement';
  payerName: string;
  /** Share of the expense that belongs to the member who did NOT pay it */
  otherShare: number;
  /** How much this movement adds to (+) or removes from (-) the current debt */
  effect: number;
}

/**
 * Explains the shared debt movement by movement, using the same rules as
 * calculateSharedDebtBalance. Effects are expressed in the direction of the current
 * debt (debtor → creditor), so they add up to amountOwed.
 */
export function getSharedDebtBreakdown(
  transactions: Transaction[],
  members: CoupleMembers
): {
  items: SharedDebtBreakdownItem[];
  creditorPaidShare: number;
  debtorPaidShare: number;
  settlementsTotal: number;
} {
  const raw: { tx: Transaction; kind: 'expense' | 'settlement'; aPaid: boolean; otherShare: number; aEffect: number }[] = [];

  transactions
    .filter(t => t.scope === 'shared' && t.approvalStatus !== 'pending' && t.approvalStatus !== 'rejected')
    .forEach(t => {
      const aPaid = isMemberAPayer(t, members);
      if (isSettlementTx(t)) {
        // A paying B lowers what B owes A (and vice versa)
        raw.push({ tx: t, kind: 'settlement', aPaid, otherShare: 0, aEffect: aPaid ? t.amount : -t.amount });
        return;
      }
      if (t.type !== 'expense') return;
      const { aRatio, bRatio } = getMemberRatios(t, members);
      const otherShare = t.amount * (aPaid ? bRatio : aRatio);
      // Positive aEffect = B owes A more
      raw.push({ tx: t, kind: 'expense', aPaid, otherShare, aEffect: aPaid ? otherShare : -otherShare });
    });

  const aNet = raw.reduce((s, r) => s + r.aEffect, 0);
  // Same orientation as calculateSharedDebtBalance: aNet > 0 → B is the debtor
  const creditorIsA = aNet >= 0;
  const sign = creditorIsA ? 1 : -1;

  let creditorPaidShare = 0;
  let debtorPaidShare = 0;
  let settlementsTotal = 0;

  const items: SharedDebtBreakdownItem[] = raw.map(r => {
    const effect = r.aEffect * sign;
    if (r.kind === 'settlement') settlementsTotal += effect;
    else if (r.aPaid === creditorIsA) creditorPaidShare += effect;
    else debtorPaidShare += effect;
    return {
      transaction: r.tx,
      kind: r.kind,
      payerName: r.aPaid ? members.a.name : members.b.name,
      otherShare: r.otherShare,
      effect,
    };
  });

  items.sort((x, y) =>
    (y.transaction.date || '').localeCompare(x.transaction.date || '') ||
    (y.transaction.createdAt || '').localeCompare(x.transaction.createdAt || '')
  );

  return { items, creditorPaidShare, debtorPaidShare, settlementsTotal };
}
