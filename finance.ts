/**
 * Pure financial module (no UI, no I/O). Full precision internally; round only for display.
 * Conventions: R is an EFFECTIVE annual return (decimal). Monthly r = (1+R)^(1/12) - 1.
 * "End" timing = ordinary annuity; "due" = beginning of period.
 */
export type Row = { year: number; invested: number; value: number };
export type SimInput = { P?: number; R: number; months: number; due?: boolean; step?: number; lump?: number };

export const periodicRate = (R: number, perYear: number): number => Math.pow(1 + R, 1 / perYear) - 1;
export const monthlyRate = (R: number): number => periodicRate(R, 12);

/** Explicit month-by-month cash-flow schedule; the step-up applies from month 13, 25, ... */
export function simulate({ P = 0, R, months, due = false, step = 0, lump = 0 }: SimInput): Row[] {
  const r = monthlyRate(R);
  let v = lump, inv = lump;
  const rows: Row[] = [];
  for (let m = 1; m <= months; m++) {
    const c = P * Math.pow(1 + step, Math.floor((m - 1) / 12));
    inv += c;
    v = due ? (v + c) * (1 + r) : v * (1 + r) + c;
    if (m % 12 === 0 || m === months) rows.push({ year: Math.ceil(m / 12), invested: inv, value: v });
  }
  return rows;
}

export function fvAnnuity(pmt: number, r: number, n: number, due: boolean): number {
  if (r === 0) return pmt * n;
  const f = (pmt * (Math.pow(1 + r, n) - 1)) / r;
  return due ? f * (1 + r) : f;
}

/** `delay` = periods before the annuity starts, discounted at (1+r)^delay. */
export function pvAnnuity(pmt: number, r: number, n: number, due: boolean, delay = 0): number {
  let p = r === 0 ? pmt * n : (pmt * (1 - Math.pow(1 + r, -n))) / r;
  if (due) p *= 1 + r;
  return p / Math.pow(1 + r, delay);
}

/** target in today's rupees; infl in percent; R and step are decimals. */
export function goalSIP(o: { target: number; infl: number; months: number; R: number; exist: number; due: boolean; step: number }) {
  const T = o.target * Math.pow(1 + o.infl / 100, o.months / 12);
  const ex = o.exist * Math.pow(1 + monthlyRate(o.R), o.months);
  if (T - ex <= 0) return { T, ex, P: 0 };
  const unit = simulate({ P: 1, R: o.R, months: o.months, due: o.due, step: o.step }).at(-1)!.value;
  return { T, ex, P: (T - ex) / unit };
}

export const realReturn = (nominal: number, inflation: number): number => (1 + nominal) / (1 + inflation) - 1;
export const deflate = (value: number, inflation: number, years: number): number => value / Math.pow(1 + inflation, years);
