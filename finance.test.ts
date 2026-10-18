import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate, fvAnnuity, pvAnnuity, goalSIP, periodicRate, monthlyRate, realReturn, deflate } from '../lib/finance.ts';
import { inr } from '../lib/format.ts';

const near = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);
const last = (o: Parameters<typeof simulate>[0]) => simulate(o).at(-1)!;
// Independent oracle: compound each payment separately to the end.
const brute = (P: number, R: number, n: number, due: boolean, step = 0, lump = 0) => {
  const r = monthlyRate(R); let v = lump * Math.pow(1 + r, n);
  for (let m = 1; m <= n; m++) v += P * Math.pow(1 + step, Math.floor((m - 1) / 12)) * Math.pow(1 + r, n - m + (due ? 1 : 0));
  return v;
};

test('FV ordinary: 5000/mo at 1%/mo for 120 months', () => near(last({ P: 5000, R: Math.pow(1.01, 12) - 1, months: 120 }).value, 1150193.4473, 1e-9));
test('annuity due = ordinary × (1+r)', () => { const R = 0.12; near(last({ P: 5000, R, months: 120, due: true }).value, last({ P: 5000, R, months: 120 }).value * (1 + monthlyRate(R))); });
test('zero rate / zero contribution / one period', () => {
  near(last({ P: 5000, R: 0, months: 120 }).value, 600000);
  near(last({ P: 0, R: 0.1, months: 60, lump: 1e5 }).value, 1e5 * Math.pow(1.1, 5));
  near(last({ P: 1000, R: 0.12, months: 1 }).value, 1000);
});
test('step-up equals brute force (end, due, partial year)', () => {
  near(last({ P: 5000, R: 0.12, months: 120, step: 0.1 }).value, brute(5000, 0.12, 120, false, 0.1));
  near(last({ P: 5000, R: 0.09, months: 30, step: 0.05, due: true }).value, brute(5000, 0.09, 30, true, 0.05));
  near(last({ P: 1000, R: 0, months: 24, step: 0.1 }).invested, 25200);
});
test('closed form matches schedule when step = 0', () => near(last({ P: 5000, R: 0.12, months: 120 }).value, fvAnnuity(5000, monthlyRate(0.12), 120, false)));
test('PV/FV consistency, known PV, delay, zero rate', () => {
  for (const due of [false, true]) near(fvAnnuity(700, 0.013, 48, due), pvAnnuity(700, 0.013, 48, due) * Math.pow(1.013, 48), 1e-12);
  near(pvAnnuity(1000, 0.01, 12, false), 11255.0774, 1e-8);
  near(pvAnnuity(1000, 0.01, 12, false, 3), pvAnnuity(1000, 0.01, 12, false) / Math.pow(1.01, 3));
  near(pvAnnuity(1000, 0, 12, false), 12000); near(fvAnnuity(100, 0, 12, true), 1200);
});
test('frequency rates compound back to R', () => near(Math.pow(1 + periodicRate(0.12, 4), 4), 1.12));
test('goal SIP round-trips to the inflated target', () => {
  for (const due of [false, true]) { const o = { target: 1e7, infl: 6, months: 180, R: 0.12, exist: 50000, due, step: 0.05 }; const g = goalSIP(o);
    near(last({ P: g.P, R: o.R, months: o.months, due, step: o.step, lump: o.exist }).value, g.T); }
  assert.equal(goalSIP({ target: 1000, infl: 0, months: 120, R: 0.1, exist: 1e6, due: false, step: 0 }).P, 0);
});
test('inflation adjustment identities', () => { near(deflate(1e6, 0.06, 10), 1e6 / Math.pow(1.06, 10)); near(1 + realReturn(0.12, 0.06), 1.12 / 1.06); });
test('property: monotone in contribution and return', () => {
  for (let k = 0; k < 300; k++) { const P = Math.random() * 1e5, R = Math.random() * 0.3, m = 1 + Math.floor(Math.random() * 360), st = Math.random() * 0.2;
    assert.ok(last({ P: P + 1, R, months: m, step: st }).value >= last({ P, R, months: m, step: st }).value);
    assert.ok(last({ P, R: R + 0.01, months: m, step: st }).value >= last({ P, R, months: m, step: st }).value); }
});
test('Indian formatting and display guard', () => {
  assert.equal(inr(10000000), '₹1,00,00,000'); assert.equal(inr(100000), '₹1,00,000');
  assert.ok(inr(last({ P: 1e8, R: 0.5, months: 720, step: 0.5 }).value).startsWith('>'));
});
