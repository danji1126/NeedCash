interface ChartBarProps {
  data: { label: string; value: number }[];
  unit?: string;
}

export function ChartBar({ data, unit }: ChartBarProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 truncate text-text-muted">
            {item.label}
          </span>
          <div className="relative flex-1 h-5 rounded bg-surface-hover">
            <div
              className="h-full rounded bg-text/20"
              style={{ width: max > 0 ? `${(item.value / max) * 100}%` : "0%" }}
              aria-label={`${item.label}: ${item.value}${unit || ""}`}
            />
          </div>
          <span className="w-16 shrink-0 text-right tabular-nums text-text-secondary">
            {item.value.toLocaleString()}
            {unit && (
              <span className="ml-0.5 text-xs text-text-muted">{unit}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
