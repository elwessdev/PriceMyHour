import {
  calculateRate,
  estimateProject,
  roundToCleanPrice,
  validateRateInputs,
  type RateInputs,
  type RateResult,
} from '../lib/calc';

const DEFAULTS: RateInputs = {
  monthlyIncome: 2000,
  hoursPerDay: 6,
  daysPerWeek: 5,
  vacationDays: 20,
  nonBillablePct: 25,
  platformFeePct: 10,
  taxPct: 15,
  monthlyExpenses: 100,
  marginPct: 10,
};

function expectOk(inputs: RateInputs): RateResult {
  const outcome = calculateRate(inputs);
  if (!outcome.ok) throw new Error(`Expected ok, got errors: ${JSON.stringify(outcome.errors)}`);
  return outcome.result;
}

function expectAllFinite(r: RateResult) {
  for (const v of Object.values(r)) {
    if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
  }
  for (const v of Object.values(r.breakdown)) expect(Number.isFinite(v)).toBe(true);
}

describe('calculateRate – normal values', () => {
  it('computes every step of the default scenario', () => {
    const r = expectOk(DEFAULTS);
    expect(r.workingDaysPerYear).toBe(240); // 5 * 52 - 20
    expect(r.billableHoursPerYear).toBeCloseTo(1080); // 240 * 6 * 0.75
    expect(r.yearlyNetTarget).toBe(24000);
    expect(r.yearlyExpenses).toBe(1200);
    expect(r.grossNeeded).toBeCloseTo(24000 / 0.85 + 1200, 6);
    expect(r.withMargin).toBeCloseTo((24000 / 0.85 + 1200) * 1.1, 6);
    expect(r.beforePlatformFee).toBeCloseTo(((24000 / 0.85 + 1200) * 1.1) / 0.9, 6);
    expect(r.hourlyRate).toBeCloseTo(33.3115, 3);
    expect(r.dailyRate).toBeCloseTo(r.hourlyRate * 6, 6);
    expect(r.monthlyGross).toBeCloseTo(r.beforePlatformFee / 12, 6);
    expectAllFinite(r);
  });

  it('breakdown parts add up to what the client pays', () => {
    const r = expectOk(DEFAULTS);
    const { net, taxes, expenses, margin, platformFees } = r.breakdown;
    expect(net + taxes + expenses + margin + platformFees).toBeCloseTo(r.beforePlatformFee, 6);
    expect(taxes).toBeCloseTo(24000 / 0.85 - 24000, 6);
    expect(expenses).toBe(1200);
    expect(platformFees).toBeCloseTo(r.beforePlatformFee * 0.1, 6);
  });

  it('with zero tax, fees, margin and expenses the rate is just income / hours', () => {
    const r = expectOk({
      ...DEFAULTS,
      taxPct: 0,
      platformFeePct: 0,
      marginPct: 0,
      monthlyExpenses: 0,
      nonBillablePct: 0,
      vacationDays: 0,
    });
    // 24000 / (5 * 52 * 6)
    expect(r.hourlyRate).toBeCloseTo(24000 / 1560, 6);
  });

  it('higher platform fees raise the hourly rate', () => {
    const upwork = expectOk({ ...DEFAULTS, platformFeePct: 10 }).hourlyRate;
    const fiverr = expectOk({ ...DEFAULTS, platformFeePct: 20 }).hourlyRate;
    const direct = expectOk({ ...DEFAULTS, platformFeePct: 0 }).hourlyRate;
    expect(direct).toBeLessThan(upwork);
    expect(upwork).toBeLessThan(fiverr);
  });

  it('accepts zero income (expenses only)', () => {
    const r = expectOk({ ...DEFAULTS, monthlyIncome: 0 });
    expect(r.hourlyRate).toBeGreaterThan(0);
    expect(r.breakdown.taxes).toBe(0);
  });

  it('returns a zero rate when there is nothing to earn', () => {
    const r = expectOk({ ...DEFAULTS, monthlyIncome: 0, monthlyExpenses: 0 });
    expect(r.hourlyRate).toBe(0);
    expectAllFinite(r);
  });

  it('handles fractional and extreme-but-valid inputs without NaN', () => {
    const r = expectOk({
      ...DEFAULTS,
      hoursPerDay: 0.5,
      daysPerWeek: 1,
      vacationDays: 51,
      nonBillablePct: 99.9,
      platformFeePct: 99.9,
      taxPct: 99.9,
      marginPct: 1000,
      monthlyIncome: 1e9,
    });
    expectAllFinite(r);
    expect(r.hourlyRate).toBeGreaterThan(0);
  });
});

describe('calculateRate – edge cases and validation', () => {
  it('rejects 0 billable hours per day', () => {
    const o = calculateRate({ ...DEFAULTS, hoursPerDay: 0 });
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.errors.hoursPerDay).toBeDefined();
  });

  it('rejects 0 working days per week', () => {
    const o = calculateRate({ ...DEFAULTS, daysPerWeek: 0 });
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.errors.daysPerWeek).toBeDefined();
  });

  it('rejects more than 24 hours a day or 7 days a week', () => {
    expect(calculateRate({ ...DEFAULTS, hoursPerDay: 25 }).ok).toBe(false);
    expect(calculateRate({ ...DEFAULTS, daysPerWeek: 8 }).ok).toBe(false);
  });

  it('rejects vacation that consumes every working day', () => {
    const o = calculateRate({ ...DEFAULTS, daysPerWeek: 5, vacationDays: 260 });
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.errors.vacationDays).toBeDefined();
  });

  it('rejects 100% platform fee (division by zero)', () => {
    const o = calculateRate({ ...DEFAULTS, platformFeePct: 100 });
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.errors.platformFeePct).toBeDefined();
  });

  it('rejects 100% tax rate (division by zero)', () => {
    const o = calculateRate({ ...DEFAULTS, taxPct: 100 });
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.errors.taxPct).toBeDefined();
  });

  it('rejects 100% non-billable time (zero billable hours)', () => {
    const o = calculateRate({ ...DEFAULTS, nonBillablePct: 100 });
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.errors.nonBillablePct).toBeDefined();
  });

  it('rejects negative values', () => {
    const o = calculateRate({
      ...DEFAULTS,
      monthlyIncome: -1,
      monthlyExpenses: -1,
      vacationDays: -1,
      taxPct: -1,
      platformFeePct: -1,
      nonBillablePct: -1,
      marginPct: -1,
    });
    expect(o.ok).toBe(false);
    if (!o.ok) {
      expect(Object.keys(o.errors).sort()).toEqual(
        ['marginPct', 'monthlyExpenses', 'monthlyIncome', 'nonBillablePct', 'platformFeePct', 'taxPct', 'vacationDays'].sort(),
      );
    }
  });

  it('treats empty input (NaN) as an error for every field instead of crashing', () => {
    const empty = Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, NaN])) as unknown as RateInputs;
    const errors = validateRateInputs(empty);
    expect(Object.keys(errors).sort()).toEqual(Object.keys(DEFAULTS).sort());
    expect(calculateRate(empty).ok).toBe(false);
  });

  it('rejects Infinity', () => {
    expect(calculateRate({ ...DEFAULTS, monthlyIncome: Infinity }).ok).toBe(false);
    expect(calculateRate({ ...DEFAULTS, hoursPerDay: Infinity }).ok).toBe(false);
  });

  it('never returns NaN or Infinity across a grid of inputs', () => {
    const values = [NaN, -5, 0, 0.01, 1, 6, 24, 50, 99.99, 100, 1000, 1e13, Infinity];
    const fields = Object.keys(DEFAULTS) as (keyof RateInputs)[];
    for (const field of fields) {
      for (const v of values) {
        const o = calculateRate({ ...DEFAULTS, [field]: v });
        if (o.ok) expectAllFinite(o.result);
      }
    }
  });
});

describe('roundToCleanPrice', () => {
  it('rounds up to a step that scales with the amount', () => {
    expect(roundToCleanPrice(42.1)).toBe(45);
    expect(roundToCleanPrice(45)).toBe(45);
    expect(roundToCleanPrice(432.5)).toBe(440);
    expect(roundToCleanPrice(1234)).toBe(1250);
    expect(roundToCleanPrice(12_345)).toBe(12_400);
    expect(roundToCleanPrice(123_456)).toBe(124_000);
  });

  it('returns 0 for zero, negative or invalid input', () => {
    expect(roundToCleanPrice(0)).toBe(0);
    expect(roundToCleanPrice(-10)).toBe(0);
    expect(roundToCleanPrice(NaN)).toBe(0);
    expect(roundToCleanPrice(Infinity)).toBe(0);
  });
});

describe('estimateProject', () => {
  it('applies buffer, platform fee and clean rounding', () => {
    const o = estimateProject({ hours: 40, bufferPct: 20, hourlyRate: 50, platformFeePct: 10 });
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    expect(o.result.bufferedHours).toBeCloseTo(48);
    expect(o.result.clientPays).toBeCloseTo(2400);
    expect(o.result.platformFee).toBeCloseTo(240);
    expect(o.result.youReceive).toBeCloseTo(2160);
    expect(o.result.suggestedPrice).toBe(2400);
    expect(o.result.suggestedYouReceive).toBeCloseTo(2160);
  });

  it('works with no buffer and no fee', () => {
    const o = estimateProject({ hours: 10, bufferPct: 0, hourlyRate: 33.31, platformFeePct: 0 });
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    expect(o.result.youReceive).toBeCloseTo(333.1);
    expect(o.result.suggestedPrice).toBe(340);
  });

  it('rejects 0 hours and invalid buffer', () => {
    const o = estimateProject({ hours: 0, bufferPct: -1, hourlyRate: 50, platformFeePct: 10 });
    expect(o.ok).toBe(false);
    if (!o.ok) {
      expect(o.errors.hours).toBeDefined();
      expect(o.errors.bufferPct).toBeDefined();
    }
  });

  it('rejects empty (NaN) hours', () => {
    expect(estimateProject({ hours: NaN, bufferPct: 20, hourlyRate: 50, platformFeePct: 10 }).ok).toBe(false);
  });

  it('a 100% fee means you receive nothing, without NaN', () => {
    const o = estimateProject({ hours: 10, bufferPct: 0, hourlyRate: 50, platformFeePct: 100 });
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    expect(o.result.youReceive).toBe(0);
    expect(o.result.suggestedYouReceive).toBe(0);
  });

  it('falls back to a zero price when the hourly rate is invalid', () => {
    const o = estimateProject({ hours: 10, bufferPct: 20, hourlyRate: NaN, platformFeePct: NaN });
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    for (const v of Object.values(o.result)) expect(Number.isFinite(v)).toBe(true);
    expect(o.result.clientPays).toBe(0);
  });
});
