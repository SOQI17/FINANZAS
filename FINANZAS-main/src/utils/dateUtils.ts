const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Returns current period as YYYY-MM (e.g. "2026-09")
 */
export function getCurrentPeriod(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns current date as YYYY-MM-DD (e.g. "2026-09-01")
 */
export function getCurrentDateISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date as YYYY-MM-DD
 */
export function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM to professional Spanish month string: e.g. "Septiembre 2026 (Actual)"
 */
export function formatPeriodLabel(periodStr: string): string {
  if (!periodStr) return '';
  const [yearStr, monthStr] = periodStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const currentPeriod = getCurrentPeriod();
  
  const monthName = MONTH_NAMES[monthIndex] || monthStr;
  if (periodStr === currentPeriod) {
    return `${monthName} ${year} (Mes Actual)`;
  }
  return `${monthName} ${year}`;
}

/**
 * Generates a list of periods for selection (past 12 months up to current & next month)
 */
export function getAvailablePeriods(): { value: string; label: string }[] {
  const periods: { value: string; label: string }[] = [];
  const now = new Date();
  const currentPeriod = getCurrentPeriod();

  // Generate 12 months: from 10 months ago to current month and 1 month ahead
  for (let i = -1; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const periodKey = `${yyyy}-${mm}`;
    periods.push({
      value: periodKey,
      label: formatPeriodLabel(periodKey)
    });
  }

  // Deduplicate by value
  const map = new Map<string, string>();
  periods.forEach(p => map.set(p.value, p.label));

  // Ensure currentPeriod is present
  if (!map.has(currentPeriod)) {
    map.set(currentPeriod, formatPeriodLabel(currentPeriod));
  }

  // Convert to array and sort descending (most recent month first)
  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value.localeCompare(a.value));
}
