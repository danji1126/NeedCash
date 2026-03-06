interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
}

export function StatCard({ label, value, change }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold font-heading tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {change !== undefined && (
        <p
          className={`mt-1 text-xs ${
            change > 0
              ? "text-green-400"
              : change < 0
                ? "text-red-400"
                : "text-text-muted"
          }`}
        >
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
