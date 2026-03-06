import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-heading">Analytics</h1>
      <p className="mt-2 text-text-muted">
        방문자 통계 및 게임 리더보드 관리
      </p>
      <div className="mt-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
