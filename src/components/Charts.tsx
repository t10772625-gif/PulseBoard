// Tiny dependency-free SVG charts. Colors come from CSS variables so they follow the theme.

export type Series = { name: string; color: string; values: number[]; dashed?: boolean; fill?: boolean };

export function LineChart({ series, labels, height = 160, stacked }: { series: Series[]; labels: string[]; height?: number; stacked?: boolean }) {
  const W = 320;
  const H = height;
  const pad = { l: 26, r: 8, t: 10, b: 22 };
  const n = Math.max(...series.map((s) => s.values.length), 2);
  const stackedVals = stacked
    ? series.map((_, si) => series[0].values.map((__, i) => series.slice(0, si + 1).reduce((sum, s) => sum + (s.values[i] ?? 0), 0)))
    : series.map((s) => s.values);
  const max = Math.max(1, ...stackedVals.flat());
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const pts = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }} role="img" aria-label={series.map((s) => s.name).join(", ")}>
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="var(--line)" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="var(--line)" />
      <text x={pad.l - 4} y={pad.t + 8} fontSize="9" textAnchor="end" fill="var(--mute)">
        {max}
      </text>
      <text x={pad.l - 4} y={H - pad.b} fontSize="9" textAnchor="end" fill="var(--mute)">
        0
      </text>
      {[...stackedVals].reverse().map((vals, ri) => {
        const s = series[series.length - 1 - ri];
        return (
          <g key={s.name}>
            {(s.fill || stacked) && <polygon points={`${x(0)},${y(0)} ${pts(vals)} ${x(vals.length - 1)},${y(0)}`} fill={s.color} opacity={stacked ? 0.85 : 0.14} />}
            <polyline points={pts(vals)} fill="none" stroke={s.color} strokeWidth={stacked ? 1 : 2.5} strokeDasharray={s.dashed ? "5 5" : undefined} strokeLinejoin="round" />
          </g>
        );
      })}
      {labels.map((l, i) =>
        i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1 ? (
          <text key={i} x={x(i)} y={H - 6} fontSize="9" textAnchor="middle" fill="var(--mute)">
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

export function Legend({ series }: { series: Series[] }) {
  return (
    <div className="pill-row" style={{ fontSize: 12, marginTop: 6 }}>
      {series.map((s) => (
        <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <i style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function Bars({ values, labels, color = "var(--acc)", suffix = "" }: { values: number[]; labels: string[]; color?: string; suffix?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars" style={{ marginBottom: 22 }}>
      {values.map((v, i) => (
        <div key={i} style={{ height: `${(v / max) * 100}%`, background: color }} title={`${labels[i]}: ${v}${suffix}`}>
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
