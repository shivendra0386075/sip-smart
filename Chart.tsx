import type { Row } from '../lib/finance';
import { inr } from '../lib/format';
export default function Chart({ rows }: { rows: Row[] }) {
  const W = 640, H = 260, p = 34, n = rows.length, bw = (W - p * 1.5) / n;
  const mx = Math.max(...rows.map((r) => r.value)) || 1, area = H - p - 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Invested amount versus gains by year (data in table)">
      {rows.map((r, i) => {
        const x = p + i * bw, hi = (r.invested / mx) * area, hg = Math.max(((r.value - r.invested) / mx) * area, 0);
        return (
          <g key={r.year}>
            <rect x={x + 1} y={H - p - hi} width={Math.max(bw - 2, 1)} height={hi} fill="var(--ac)"><title>{`Year ${r.year}: invested ${inr(r.invested)}`}</title></rect>
            <rect x={x + 1} y={H - p - hi - hg} width={Math.max(bw - 2, 1)} height={hg} fill="var(--ac2)"><title>{`Year ${r.year}: value ${inr(r.value)}`}</title></rect>
            {(n <= 15 || i % Math.ceil(n / 12) === 0) && <text x={x + bw / 2} y={H - p + 14} fontSize="10" textAnchor="middle" fill="var(--mu)">{r.year}</text>}
          </g>
        );
      })}
      <text x={p} y={H - 4} fontSize="11" fill="var(--mu)">Year · teal = invested, amber = gains</text>
    </svg>
  );
}
