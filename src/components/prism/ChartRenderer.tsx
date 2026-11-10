import type { ChartEl } from "@/lib/prism/types";

const PALETTE = ["#22d3ee", "#818cf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#38bdf8", "#f97316"];

function point(cx: number, cy: number, radius: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + Math.cos(rad) * radius, y: cy + Math.sin(rad) * radius };
}

function sectorPath(cx: number, cy: number, radius: number, start: number, end: number, inner = 0) {
  const a = point(cx, cy, radius, start), b = point(cx, cy, radius, end);
  const large = end - start > 180 ? 1 : 0;
  if (inner > 0) {
    const c = point(cx, cy, inner, end), d = point(cx, cy, inner, start);
    return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`;
  }
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

export function ChartRenderer({ chart }: { chart: ChartEl }) {
  const data = chart.data.filter(item => Number.isFinite(item.value));
  const max = Math.max(1, ...data.map(item => item.value));
  const min = Math.min(0, ...data.map(item => item.value));
  const range = Math.max(1, max - min);
  const showValues = chart.showValues ?? false;

  return <div className="chart-renderer" style={{ color: chart.textColor }}>
    <div className="chart-title">{chart.title}</div>
    <svg viewBox="0 0 800 430" role="img" aria-label={`${chart.title}, ${chart.chartType} chart`} preserveAspectRatio="xMidYMid meet">
      {(chart.chartType === "pie" || chart.chartType === "donut") ? (() => {
        const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0) || 1;
        let angle = 0;
        return <g>{data.map((item, index) => {
          const sweep = Math.max(0, item.value) / total * 360;
          const path = sectorPath(400, 210, 154, angle, angle + sweep, chart.chartType === "donut" ? 88 : 0);
          const start = angle;
          angle += sweep;
          const mid = start + sweep / 2;
          const label = point(400, 210, chart.chartType === "donut" ? 187 : 185, mid);
          return <g key={item.label + index}><path d={path} fill={PALETTE[index % PALETTE.length]} stroke="#111827" strokeWidth="3" /><title>{item.label}: {item.value}</title>{showValues && <text x={label.x} y={label.y} fill={chart.textColor} fontSize="17" textAnchor="middle" dominantBaseline="middle">{item.value}</text>}</g>;
        })}</g>;
      })() : chart.chartType === "line" || chart.chartType === "area" ? (() => {
        const left = 82, right = 760, top = 55, bottom = 350;
        const positions = data.map((item, index) => ({
          x: data.length < 2 ? (left + right) / 2 : left + (index / (data.length - 1)) * (right - left),
          y: bottom - ((item.value - min) / range) * (bottom - top),
        }));
        const path = positions.map((p, index) => `${index ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
        const areaPath = `${path} L ${right} ${bottom} L ${left} ${bottom} Z`;
        return <g>
          {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1={left} x2={right} y1={top + i * ((bottom - top) / 4)} y2={top + i * ((bottom - top) / 4)} stroke="currentColor" opacity=".14" strokeDasharray="5 6" /></g>)}
          {chart.chartType === "area" && <path d={areaPath} fill={chart.color} opacity=".22" />}
          <path d={path} fill="none" stroke={chart.color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          {positions.map((p, index) => <g key={data[index]?.label}><circle cx={p.x} cy={p.y} r="8" fill={chart.color} stroke="#111827" strokeWidth="3" />{showValues && <text x={p.x} y={p.y - 18} textAnchor="middle" fill="currentColor" fontSize="17">{data[index]?.value}</text>}<text x={p.x} y="390" fill="currentColor" fontSize="16" textAnchor="middle">{data[index]?.label}</text></g>)}
          <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="currentColor" opacity=".55" />
        </g>;
      })() : chart.chartType === "horizontal" ? <g>
        {data.map((item, index) => {
          const y = 60 + index * (340 / Math.max(1, data.length));
          const width = Math.max(2, (Math.max(0, item.value) / max) * 500);
          return <g key={item.label + index}><text x="18" y={y + 21} fill="currentColor" fontSize="17">{item.label}</text><rect x="230" y={y} width={width} height="28" rx="6" fill={PALETTE[index % PALETTE.length]} />{showValues && <text x={Math.min(770, 238 + width)} y={y + 21} fill="currentColor" fontSize="16">{item.value}</text>}</g>;
        })}
      </g> : <g>
        {[0, 1, 2, 3, 4].map(i => <line key={i} x1="55" x2="770" y1={350 - i * 72} y2={350 - i * 72} stroke="currentColor" opacity=".14" strokeDasharray="5 6" />)}
        {data.map((item, index) => {
          const slot = 715 / Math.max(1, data.length);
          const width = Math.min(90, slot * .62);
          const height = Math.max(2, (Math.max(0, item.value) / max) * 288);
          const x = 55 + index * slot + (slot - width) / 2;
          const y = 350 - height;
          return <g key={item.label + index}><rect x={x} y={y} width={width} height={height} rx="7" fill={chart.chartType === "column" ? chart.color : PALETTE[index % PALETTE.length]} />{showValues && <text x={x + width / 2} y={y - 10} fill="currentColor" textAnchor="middle" fontSize="16">{item.value}</text>}<text x={x + width / 2} y="390" fill="currentColor" textAnchor="middle" fontSize="15">{item.label}</text></g>;
        })}
        <line x1="55" x2="770" y1="350" y2="350" stroke="currentColor" opacity=".55" />
      </g>}
    </svg>
    {chart.showLegend !== false && (chart.chartType === "pie" || chart.chartType === "donut") && <div className="chart-legend">{data.map((item, index) => <span key={item.label + index}><i style={{ background: PALETTE[index % PALETTE.length] }} />{item.label}</span>)}</div>}
    {chart.axisLabel && <small className="chart-axis-label">{chart.axisLabel}</small>}
  </div>;
}
