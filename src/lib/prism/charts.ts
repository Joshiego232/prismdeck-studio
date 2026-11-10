export interface ChartDatum { label: string; value: number }

export function parseChartData(source: string): ChartDatum[] {
  const rows = source.split(/\r?\n/).map(row => row.trim()).filter(Boolean);
  const data: ChartDatum[] = [];
  for (const row of rows) {
    const cells = row.includes("\t") ? row.split("\t") : row.split(",");
    if (cells.length < 2) continue;
    const label = cells[0]!.trim().replace(/^["']|["']$/g, "");
    const raw = cells.slice(1).join(",").trim().replace(/[,$%]/g, "");
    const value = Number(raw);
    if (!label || !Number.isFinite(value)) {
      if (!data.length && /label|name|category/i.test(label)) continue;
      continue;
    }
    data.push({ label, value });
  }
  return data.slice(0, 100);
}

export function serializeChartData(data: ChartDatum[]): string {
  return data.map(item => `${item.label},${item.value}`).join("\n");
}
