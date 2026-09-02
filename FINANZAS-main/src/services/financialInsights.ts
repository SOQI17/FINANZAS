import { Transaction, Budget, FinancialInsight, FinancialMetrics } from '../types';

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
  user1Id: string,
  user2Id: string,
  user1Name: string,
  user2Name: string
): {
  netAmount: number;
  debtorId: string | null;
  creditorId: string | null;
  debtorName: string;
  creditorName: string;
  amountOwed: number;
  isBalanced: boolean;
} {
  // Calculate shared expenses paid by user1 vs user2
  let user1PaidTotal = 0;
  let user2PaidTotal = 0;

  // Amount user1 is responsible for vs amount user2 is responsible for
  let user1ShareTotal = 0;
  let user2ShareTotal = 0;

  transactions
    .filter(t => t.scope === 'shared' && t.type === 'expense' && t.approvalStatus !== 'pending' && t.approvalStatus !== 'rejected')
    .forEach(t => {
      const amount = t.amount;
      const paidBy = t.paidBy || '';

      const u1CleanName = user1Name ? user1Name.toLowerCase() : '';
      const u2CleanName = user2Name ? user2Name.toLowerCase() : '';
      const pByClean = paidBy.toLowerCase();
      const uNameClean = (t.userName || '').toLowerCase();

      const isUser1Paid = paidBy === user1Id ||
        (u1CleanName && (pByClean.includes(u1CleanName) || uNameClean.includes(u1CleanName))) ||
        (u1CleanName.includes('alexis') && (pByClean.includes('alexis') || uNameClean.includes('alexis')));

      const isUser2Paid = paidBy === user2Id ||
        (u2CleanName && (pByClean.includes(u2CleanName) || uNameClean.includes(u2CleanName))) ||
        (u2CleanName.includes('karla') && (pByClean.includes('karla') || pByClean.includes('karlita') || uNameClean.includes('karla') || uNameClean.includes('karlita')));

      if (isUser1Paid) {
        user1PaidTotal += amount;
      } else if (isUser2Paid) {
        user2PaidTotal += amount;
      } else {
        // Fallback matching
        if (pByClean.includes('alexis')) user1PaidTotal += amount;
        else if (pByClean.includes('karla') || pByClean.includes('karlita')) user2PaidTotal += amount;
        else user1PaidTotal += amount;
      }

      // Calculate share responsibility
      let u1Ratio = 0.5;
      let u2Ratio = 0.5;

      if (t.splitRatioUser1 !== undefined && t.splitRatioUser2 !== undefined) {
        u1Ratio = t.splitRatioUser1;
        u2Ratio = t.splitRatioUser2;
      } else if (t.splitMethod === 'full') {
        // paidBy pays, assigned 100% to the other person
        if (isUser1Paid) {
          u1Ratio = 0;
          u2Ratio = 1.0;
        } else {
          u1Ratio = 1.0;
          u2Ratio = 0;
        }
      } else if (t.splitMethod === '60_40') {
        u1Ratio = isUser1Paid ? 0.6 : 0.4;
        u2Ratio = isUser1Paid ? 0.4 : 0.6;
      } else if (t.splitMethod === '70_30') {
        u1Ratio = isUser1Paid ? 0.7 : 0.3;
        u2Ratio = isUser1Paid ? 0.3 : 0.7;
      } else if (t.splitMethod === '80_20') {
        u1Ratio = isUser1Paid ? 0.8 : 0.2;
        u2Ratio = isUser1Paid ? 0.2 : 0.8;
      } else if (t.splitMethod === 'custom' || t.splitMethod === 'custom_percentage') {
        u1Ratio = t.splitRatioUser1 ?? 0.5;
        u2Ratio = t.splitRatioUser2 ?? 0.5;
      }

      user1ShareTotal += amount * u1Ratio;
      user2ShareTotal += amount * u2Ratio;
    });

  // Net balance for user1: (Amount user1 paid) - (Amount user1 was supposed to pay)
  // If positive, user1 paid more than their share -> user2 owes user1
  // If negative, user1 paid less than their share -> user1 owes user2
  const user1Net = user1PaidTotal - user1ShareTotal;

  if (Math.abs(user1Net) < 0.01) {
    return {
      netAmount: 0,
      debtorId: null,
      creditorId: null,
      debtorName: '',
      creditorName: '',
      amountOwed: 0,
      isBalanced: true,
    };
  } else if (user1Net > 0) {
    // User2 owes User1
    return {
      netAmount: user1Net,
      debtorId: user2Id,
      creditorId: user1Id,
      debtorName: user2Name,
      creditorName: user1Name,
      amountOwed: user1Net,
      isBalanced: false,
    };
  } else {
    // User1 owes User2
    return {
      netAmount: user1Net,
      debtorId: user1Id,
      creditorId: user2Id,
      debtorName: user1Name,
      creditorName: user2Name,
      amountOwed: Math.abs(user1Net),
      isBalanced: false,
    };
  }
}
