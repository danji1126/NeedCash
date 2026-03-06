"use client";

import { useState, useEffect, useCallback } from "react";

interface AnalyticsToggleProps {
  apiKey: string;
}

export function AnalyticsToggle({ apiKey }: AnalyticsToggleProps) {
  const [enabled, setEnabled] = useState(true);
  const [autoOff, setAutoOff] = useState(false);
  const [usage, setUsage] = useState({ today: 0, threshold: 90000 });
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics/config", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { enabled: boolean; autoOff: boolean; today: number; threshold: number };
        setEnabled(data.enabled);
        setAutoOff(data.autoOff);
        setUsage({ today: data.today, threshold: data.threshold });
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleToggle = async () => {
    const newValue = !enabled;
    setEnabled(newValue);

    await fetch("/api/admin/analytics/config", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled: newValue }),
    });

    fetchUsage();
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-border/60 p-4">
        <div className="h-6 w-32 rounded bg-surface-hover" />
        <div className="mt-3 h-2 rounded-full bg-surface-hover" />
      </div>
    );
  }

  const percentage = usage.threshold > 0 ? (usage.today / usage.threshold) * 100 : 0;

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">통계 수집</h3>
          <p className="text-sm text-text-muted">
            {autoOff
              ? "자동 차단됨 (한도 초과)"
              : enabled
                ? "수집 중"
                : "수집 중지"}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            enabled ? "bg-green-500" : "bg-surface-hover"
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label="통계 수집 토글"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-text-muted">
          <span>오늘 {usage.today.toLocaleString()}</span>
          <span>{usage.threshold.toLocaleString()}</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full transition-all ${
              percentage > 90
                ? "bg-red-500"
                : percentage > 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {percentage.toFixed(1)}% 사용
        </p>
      </div>

      {autoOff && (
        <div className="mt-3 rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
          일별 한도에 도달하여 자동 차단되었습니다. 다음 날 자동 해제됩니다.
        </div>
      )}
    </div>
  );
}
