/**
 * Pure rate-calculation logic. No React or platform imports, so it can be
 * unit-tested directly with Jest.
 */

export interface RateInputs {
  /** Target monthly net income (after tax). */
  monthlyIncome: number;
  hoursPerDay: number;
  daysPerWeek: number;
  vacationDays: number;
  /** Share of working time that cannot be billed, 0–99.99. */
  nonBillablePct: number;
  /** Platform fee taken from what the client pays, 0–99.99. */
  platformFeePct: number;
  /** Tax rate applied to income, 0–99.99. */
  taxPct: number;
  monthlyExpenses: number;
  /** Extra profit / safety margin on top of gross needed. */
  marginPct: number;
}

export type RateField = keyof RateInputs;
export type RateErrors = Partial<Record<RateField, string>>;

/** Yearly amounts that together make up what the client pays. */
export interface Breakdown {
  net: number;
  taxes: number;
  expenses: number;
  margin: number;
  platformFees: number;
}

export interface RateResult {
  workingDaysPerYear: number;
  billableHoursPerYear: number;
  yearlyNetTarget: number;
  yearlyExpenses: number;
  grossNeeded: number;
  withMargin: number;
  beforePlatformFee: number;
  hourlyRate: number;
  dailyRate: number;
  monthlyGross: number;
  /** Yearly breakdown; values sum to beforePlatformFee. */
  breakdown: Breakdown;
}

export type CalcOutcome =
  | { ok: true; result: RateResult }
  | { ok: false; errors: RateErrors };

const WEEKS_PER_YEAR = 52;
const MAX_MONEY = 1e12;

const isNum = (n: number): boolean => typeof n === 'number' && Number.isFinite(n);

function checkPercent(value: number, label: string, allowHundred = false): string | undefined {
  if (!isNum(value)) return 'Enter a number';
  if (value < 0) return `${label} can't be negative`;
  if (allowHundred ? value > 100 : value >= 100) {
    return allowHundred ? `${label} can't exceed 100%` : `${label} must be below 100%`;
  }
  return undefined;
}

function checkMoney(value: number): string | undefined {
  if (!isNum(value)) return 'Enter a number';
  if (value < 0) return "Can't be negative";
  if (value > MAX_MONEY) return 'Value is too large';
  return undefined;
}

/** Validates every input; returns an empty object when everything is usable. */
export function validateRateInputs(i: RateInputs): RateErrors {
  const errors: RateErrors = {};
  const set = (field: RateField, msg: string | undefined) => {
    if (msg) errors[field] = msg;
  };

  set('monthlyIncome', checkMoney(i.monthlyIncome));
  set('monthlyExpenses', checkMoney(i.monthlyExpenses));

  if (!isNum(i.hoursPerDay)) set('hoursPerDay', 'Enter a number');
  else if (i.hoursPerDay <= 0) set('hoursPerDay', 'Must be more than 0');
  else if (i.hoursPerDay > 24) set('hoursPerDay', 'A day has at most 24 hours');

  if (!isNum(i.daysPerWeek)) set('daysPerWeek', 'Enter a number');
  else if (i.daysPerWeek <= 0) set('daysPerWeek', 'Must be more than 0');
  else if (i.daysPerWeek > 7) set('daysPerWeek', 'A week has at most 7 days');

  if (!isNum(i.vacationDays)) set('vacationDays', 'Enter a number');
  else if (i.vacationDays < 0) set('vacationDays', "Can't be negative");
  else if (isNum(i.daysPerWeek) && i.daysPerWeek > 0 && i.vacationDays >= i.daysPerWeek * WEEKS_PER_YEAR) {
    set('vacationDays', 'Leaves no working days in the year');
  }

  set('nonBillablePct', checkPercent(i.nonBillablePct, 'Non-billable time'));
  set('platformFeePct', checkPercent(i.platformFeePct, 'Platform fee'));
  set('taxPct', checkPercent(i.taxPct, 'Tax rate'));

  if (!isNum(i.marginPct)) set('marginPct', 'Enter a number');
  else if (i.marginPct < 0) set('marginPct', "Can't be negative");
  else if (i.marginPct > 1000) set('marginPct', 'Margin is too large');

  return errors;
}

export function calculateRate(inputs: RateInputs): CalcOutcome {
  const errors = validateRateInputs(inputs);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const workingDaysPerYear = inputs.daysPerWeek * WEEKS_PER_YEAR - inputs.vacationDays;
  const billableHoursPerYear =
    workingDaysPerYear * inputs.hoursPerDay * (1 - inputs.nonBillablePct / 100);

  // Validation should make this unreachable, but never divide by zero.
  if (!(billableHoursPerYear > 0)) {
    return { ok: false, errors: { hoursPerDay: 'No billable hours left in the year' } };
  }

  const yearlyNetTarget = inputs.monthlyIncome * 12;
  const yearlyExpenses = inputs.monthlyExpenses * 12;
  const preTaxIncome = yearlyNetTarget / (1 - inputs.taxPct / 100);
  const grossNeeded = preTaxIncome + yearlyExpenses;
  const withMargin = grossNeeded * (1 + inputs.marginPct / 100);
  const beforePlatformFee = withMargin / (1 - inputs.platformFeePct / 100);
  const hourlyRate = beforePlatformFee / billableHoursPerYear;
  const dailyRate = hourlyRate * inputs.hoursPerDay;

  const result: RateResult = {
    workingDaysPerYear,
    billableHoursPerYear,
    yearlyNetTarget,
    yearlyExpenses,
    grossNeeded,
    withMargin,
    beforePlatformFee,
    hourlyRate,
    dailyRate,
    monthlyGross: beforePlatformFee / 12,
    breakdown: {
      net: yearlyNetTarget,
      taxes: preTaxIncome - yearlyNetTarget,
      expenses: yearlyExpenses,
      margin: withMargin - grossNeeded,
      platformFees: beforePlatformFee - withMargin,
    },
  };

  const allFinite =
    Object.values(result).every((v) => typeof v !== 'number' || Number.isFinite(v)) &&
    Object.values(result.breakdown).every(Number.isFinite);
  if (!allFinite) {
    return { ok: false, errors: { monthlyIncome: 'These values produce an invalid result' } };
  }

  return { ok: true, result };
}

// ---------------------------------------------------------------------------
// Project estimator
// ---------------------------------------------------------------------------

export interface ProjectInputs {
  hours: number;
  bufferPct: number;
  hourlyRate: number;
  platformFeePct: number;
}

export type ProjectField = 'hours' | 'bufferPct';

export interface ProjectResult {
  bufferedHours: number;
  /** What the client pays (rate already includes the platform fee). */
  clientPays: number;
  platformFee: number;
  /** What lands in your account after the platform fee. */
  youReceive: number;
  /** clientPays rounded up to a clean number. */
  suggestedPrice: number;
  suggestedYouReceive: number;
}

export type ProjectOutcome =
  | { ok: true; result: ProjectResult }
  | { ok: false; errors: Partial<Record<ProjectField, string>> };

/** Rounds up to a "clean" step that scales with the size of the amount. */
export function roundToCleanPrice(value: number): number {
  if (!isNum(value) || value <= 0) return 0;
  let step: number;
  if (value < 100) step = 5;
  else if (value < 1_000) step = 10;
  else if (value < 10_000) step = 50;
  else if (value < 100_000) step = 100;
  else step = 1_000;
  // Subtract a tiny epsilon so values like 150.0000000001 don't jump a step.
  return Math.ceil(value / step - 1e-9) * step;
}

export function estimateProject(p: ProjectInputs): ProjectOutcome {
  const errors: Partial<Record<ProjectField, string>> = {};
  if (!isNum(p.hours)) errors.hours = 'Enter a number';
  else if (p.hours <= 0) errors.hours = 'Must be more than 0';
  else if (p.hours > 100_000) errors.hours = 'Value is too large';

  if (!isNum(p.bufferPct)) errors.bufferPct = 'Enter a number';
  else if (p.bufferPct < 0) errors.bufferPct = "Can't be negative";
  else if (p.bufferPct > 500) errors.bufferPct = 'Buffer is too large';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const rate = isNum(p.hourlyRate) && p.hourlyRate > 0 ? p.hourlyRate : 0;
  const fee = isNum(p.platformFeePct) ? Math.min(Math.max(p.platformFeePct, 0), 100) : 0;

  const bufferedHours = p.hours * (1 + p.bufferPct / 100);
  const clientPays = bufferedHours * rate;
  const platformFee = clientPays * (fee / 100);
  const suggestedPrice = roundToCleanPrice(clientPays);

  return {
    ok: true,
    result: {
      bufferedHours,
      clientPays,
      platformFee,
      youReceive: clientPays - platformFee,
      suggestedPrice,
      suggestedYouReceive: suggestedPrice * (1 - fee / 100),
    },
  };
}
