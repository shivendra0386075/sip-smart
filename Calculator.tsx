'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { simulate, fvAnnuity, pvAnnuity, goalSIP, periodicRate, monthlyRate, realReturn, deflate, type Row } from '../lib/finance';
import { inr } from '../lib/format';
import Chart from './Chart';

type Num = { l: string; v: number; min: number; max: number };
type Sel = { l: string; sel: [string, string][] };
const FD: Record<string, Num | Sel> = {
  sip: { l: 'Monthly SIP (₹)', v: 5000, min: 0, max: 1e8 }, add: { l: 'Additional monthly (₹, optional)', v: 0, min: 0, max: 1e8 },
  lump: { l: 'Lumpsum (₹)', v: 100000, min: 0, max: 1e10 }, exist: { l: 'Existing savings (₹)', v: 0, min: 0, max: 1e10 },
  target: { l: 'Target amount in today’s ₹', v: 10000000, min: 1, max: 1e11 },
  rate: { l: 'Expected annual return / discount rate (%)', v: 12, min: 0, max: 50 }, infl: { l: 'Inflation (% per year)', v: 6, min: 0, max: 30 },
  yrs: { l: 'Years', v: 10, min: 0, max: 60 }, mos: { l: 'Extra months', v: 0, min: 0, max: 11 }, step: { l: 'Annual step-up (%)', v: 0, min: 0, max: 50 },
  pmt: { l: 'Payment per period (₹)', v: 10000, min: 0, max: 1e9 }, n: { l: 'Number of payments', v: 60, min: 1, max: 1200 },
  delay: { l: 'First-payment delay (periods)', v: 0, min: 0, max: 1200 },
  freq: { l: 'Frequency', sel: [['12', 'Monthly'], ['4', 'Quarterly'], ['2', 'Half-yearly'], ['1', 'Annual']] },
  due: { l: 'Contribution timing', sel: [['0', 'End of period'], ['1', 'Beginning of period']] },
};
const TABS: Record<string, [string, string[]]> = {
  sip: ['SIP Future Value', ['sip', 'rate', 'yrs', 'mos', 'due', 'step']],
  lump: ['Lumpsum', ['lump', 'rate', 'yrs', 'mos', 'add']],
  fva: ['Annuity FV', ['pmt', 'rate', 'freq', 'n', 'due']],
  pva: ['Annuity PV', ['pmt', 'rate', 'freq', 'n', 'due', 'delay']],
  goal: ['Goal SIP', ['target', 'yrs', 'mos', 'rate', 'exist', 'infl', 'step', 'due']],
  infl: ['Inflation-adjusted', ['sip', 'rate', 'yrs', 'mos', 'infl', 'step']],
};
const isSel = (f: Num | Sel): f is Sel => 'sel' in f;
const Kpi = ({ l, v, hl }: { l: string; v: string; hl?: boolean }) => <div className={'k' + (hl ? ' hl' : '')}><small>{l}</small><b>{v}</b></div>;

function YearTable({ rows }: { rows: Row[] }) {
  return (<><h3>Year-by-year</h3><div className="scroll"><table><thead><tr><th>Year</th><th>Invested</th><th>Gains</th><th>Value</th></tr></thead><tbody>
    {rows.map((r) => <tr key={r.year}><td>{r.year}</td><td>{inr(r.invested)}</td><td>{inr(r.value - r.invested)}</td><td>{inr(r.value)}</td></tr>)}
  </tbody></table></div></>);
}

function compute(tab: string, raw: Record<string, string>): { error: string } | { view: ReactNode } {
  const o: Record<string, number> = {};
  for (const id of TABS[tab][1]) {
    const f = FD[id], s = raw[id] ?? (isSel(f) ? f.sel[0][0] : String(f.v));
    if (isSel(f)) { o[id] = Number(s); continue; }
    const x = parseFloat(s);
    if (!Number.isFinite(x)) return { error: `Please enter a valid number for “${f.l}”.` };
    if (x < f.min || x > f.max) return { error: `“${f.l}” must be between ${f.min.toLocaleString('en-IN')} and ${f.max.toLocaleString('en-IN')}.` };
    if (id === 'n' && !Number.isInteger(x)) return { error: 'Number of payments must be a whole number.' };
    o[id] = x;
  }
  const R = (o.rate ?? 0) / 100, step = (o.step ?? 0) / 100, due = !!o.due;
  const months = Math.round((o.yrs ?? 0) * 12 + (o.mos ?? 0));
  if (['sip', 'lump', 'goal', 'infl'].includes(tab) && months < 1) return { error: 'Duration must be at least 1 month.' };

  if (tab === 'sip') {
    const rows = simulate({ P: o.sip, R, months, due, step }), L = rows.at(-1)!;
    return { view: <>
      <div className="kpis"><Kpi l="Invested" v={inr(L.invested)} /><Kpi l="Estimated gains" v={inr(L.value - L.invested)} /><Kpi l="Projected value" v={inr(L.value)} hl /><Kpi l="Monthly rate used" v={(monthlyRate(R) * 100).toFixed(4) + '%'} /></div>
      <Chart rows={rows} />
      <h3>Step-up comparison</h3><div className="scroll"><table><thead><tr><th>Step-up</th><th>Invested</th><th>Projected value</th></tr></thead><tbody>
        {[0, 5, 10].map((s) => { const l = simulate({ P: o.sip, R, months, due, step: s / 100 }).at(-1)!; return <tr key={s}><td>{s}%</td><td>{inr(l.invested)}</td><td>{inr(l.value)}</td></tr>; })}
      </tbody></table></div>
      <h3>Sensitivity (return ±2 pts)</h3><div className="scroll"><table><thead><tr><th>Return</th><th>Projected value</th></tr></thead><tbody>
        {[-2, 0, 2].map((d) => { const rr = Math.max(0, o.rate + d) / 100; return <tr key={d}><td>{(rr * 100).toFixed(1)}%</td><td>{inr(simulate({ P: o.sip, R: rr, months, due, step }).at(-1)!.value)}</td></tr>; })}
      </tbody></table></div>
      <YearTable rows={rows} /></> };
  }
  if (tab === 'lump') {
    const rows = simulate({ P: o.add, R, months, lump: o.lump }), L = rows.at(-1)!;
    return { view: <><div className="kpis"><Kpi l="Invested" v={inr(L.invested)} /><Kpi l="Estimated gains" v={inr(L.value - L.invested)} /><Kpi l="Projected value" v={inr(L.value)} hl /></div><Chart rows={rows} /><YearTable rows={rows} /></> };
  }
  if (tab === 'fva' || tab === 'pva') {
    const r = periodicRate(R, o.freq), total = o.pmt * o.n;
    if (tab === 'fva') { const fv = fvAnnuity(o.pmt, r, o.n, due);
      return { view: <><div className="kpis"><Kpi l="Total paid" v={inr(total)} /><Kpi l="Interest earned" v={inr(fv - total)} /><Kpi l="Future value" v={inr(fv)} hl /><Kpi l="Periodic rate" v={(r * 100).toFixed(4) + '%'} /></div><p className="note">FV = P × [((1+r)^n − 1) / r]{due ? ' × (1+r)' : ''}. A mathematical annuity assumes a fixed rate; a market-linked SIP does not.</p></> }; }
    const pv = pvAnnuity(o.pmt, r, o.n, due, o.delay);
    return { view: <><div className="kpis"><Kpi l="Total payments" v={inr(total)} /><Kpi l="Present value" v={inr(pv)} hl /><Kpi l="Periodic rate" v={(r * 100).toFixed(4) + '%'} /></div><p className="note">PV = PMT × [1 − (1+r)^(−n)] / r{due ? ' × (1+r)' : ''}{o.delay ? ` ÷ (1+r)^${o.delay}` : ''}. Present value is what future payments are worth today; future value is what today’s payments grow to.</p></> };
  }
  if (tab === 'goal') {
    const g = goalSIP({ target: o.target, infl: o.infl, months, R, exist: o.exist, due, step });
    if (g.P === 0) return { view: <p><b>Goal achievable without new SIP:</b> existing savings alone are projected to reach {inr(g.ex)} vs. inflated target {inr(g.T)}.</p> };
    const rows = simulate({ P: g.P, R, months, due, step, lump: o.exist }), L = rows.at(-1)!;
    return { view: <><div className="kpis"><Kpi l="Required monthly SIP" v={inr(g.P)} hl /><Kpi l="Inflated target" v={inr(g.T)} /><Kpi l="Total invested" v={inr(L.invested)} /><Kpi l="Estimated gains" v={inr(L.value - L.invested)} /></div><p className="note">Target of {inr(o.target)} in today’s rupees is inflated to {inr(g.T)} at {o.infl}% over the period.</p><Chart rows={rows} /></> };
  }
  const rows = simulate({ P: o.sip, R, months, step }), L = rows.at(-1)!, i = o.infl / 100;
  return { view: <><div className="kpis"><Kpi l="Nominal corpus" v={inr(L.value)} /><Kpi l="In today’s rupees" v={inr(deflate(L.value, i, months / 12))} hl /><Kpi l="Contributions" v={inr(L.invested)} /><Kpi l="Nominal gains" v={inr(L.value - L.invested)} /><Kpi l="Real annual return" v={(realReturn(R, i) * 100).toFixed(2) + '%'} /></div><p className="note">Real return = (1+nominal)/(1+inflation) − 1. Purchasing power is lower than the nominal account value.</p><Chart rows={rows} /></> };
}

export default function Calculator() {
  const [tab, setTab] = useState('sip');
  const [raw, setRaw] = useState<Record<string, string>>({});
  const res = useMemo(() => compute(tab, raw), [tab, raw]);
  return (<>
    <nav aria-label="Calculators">{Object.entries(TABS).map(([k, t]) => <button key={k} aria-current={k === tab} onClick={() => setTab(k)}>{t[0]}</button>)}</nav>
    <main>
      <section className="card"><b>{TABS[tab][0]}</b>{TABS[tab][1].map((id) => { const f = FD[id], val = raw[id] ?? (isSel(f) ? f.sel[0][0] : String(f.v)); return (<div key={id}>
        <label htmlFor={id}>{f.l}</label>
        {isSel(f) ? <select id={id} value={val} onChange={(e) => setRaw({ ...raw, [id]: e.target.value })}>{f.sel.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
          : <input id={id} type="number" inputMode="decimal" step="any" min={f.min} value={val} onChange={(e) => setRaw({ ...raw, [id]: e.target.value })} />}
      </div>); })}</section>
      <section className="card" aria-live="polite">{'error' in res ? <p className="err" role="alert">{res.error}</p> : res.view}</section>
    </main></>);
}
