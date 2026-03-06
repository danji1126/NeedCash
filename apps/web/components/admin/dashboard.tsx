"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/admin/auth-provider";
import { StatCard } from "@/components/admin/stat-card";
import { ChartBar } from "@/components/admin/chart-bar";
import type { PostMeta } from "@/lib/db";

const GAME_LABELS: Record<string, string> = {
  reaction: "Reaction Test",
  "color-sense": "Color Sense",
  "color-memory": "Color Memory",
  typing: "Typing Speed",
  math: "Math Challenge",
};

const GAMES = Object.keys(GAME_LABELS);

interface BlogData {
  total: number;
  published: number;
  draft: number;
  recent: (PostMeta & { id: number })[];
}

interface GameStat {
  game: string;
  label: string;
  plays: number;
}

export function Dashboard() {
  const { apiKey, logout } = useAuth();
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    async function fetchData() {
      try {
        const [postsRes, ...gameResults] = await Promise.all([
          fetch("/api/posts/admin", {
            headers: { Authorization: `Bearer ${apiKey}` },
          }),
          ...GAMES.map((game) =>
            fetch(`/api/scores/${game}?limit=1`)
              .then((r) => r.json() as Promise<{ total?: number }>)
              .then((data) => ({
                game,
                label: GAME_LABELS[game],
                plays: data.total ?? 0,
              }))
              .catch(() => ({ game, label: GAME_LABELS[game], plays: 0 }))
          ),
        ]);

        if (postsRes.status === 401) {
          logout();
          return;
        }

        if (postsRes.ok) {
          const posts = (await postsRes.json()) as (PostMeta & {
            id: number;
          })[];
          const published = posts.filter((p) => p.published).length;
          setBlog({
            total: posts.length,
            published,
            draft: posts.length - published,
            recent: posts.slice(0, 5),
          });
        }

        const stats = (gameResults as GameStat[]).sort(
          (a, b) => b.plays - a.plays
        );
        setGameStats(stats);
        setTotalPlays(stats.reduce((sum, g) => sum + g.plays, 0));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [apiKey, logout]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-muted">
          데이터를 불러오는 중 문제가 발생했습니다.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-bg-secondary"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">대시보드</h2>
        <button
          onClick={logout}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
        >
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="총 포스트" value={blog?.total ?? 0} />
        <StatCard label="발행" value={blog?.published ?? 0} />
        <StatCard label="초안" value={blog?.draft ?? 0} />
        <StatCard label="총 플레이" value={totalPlays} />
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/blog/new"
          className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          + 새 글 작성
        </Link>
        <Link
          href="/admin/blog"
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
        >
          블로그 관리
        </Link>
        <Link
          href="/admin/analytics"
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
        >
          통계 상세
        </Link>
      </div>

      {/* Bottom Two Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Blog Posts */}
        <div className="rounded-lg border border-border/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold">최근 블로그</h3>
            <Link
              href="/admin/blog"
              className="text-xs text-text-muted transition-colors hover:text-text-secondary"
            >
              더보기 →
            </Link>
          </div>
          {blog && blog.recent.length > 0 ? (
            <div className="space-y-3">
              {blog.recent.map((post) => (
                <div
                  key={post.slug}
                  className="flex items-center justify-between gap-2"
                >
                  <Link
                    href={`/admin/blog/${post.slug}/edit`}
                    className="min-w-0 flex-1 truncate text-sm font-medium transition-colors hover:text-text-muted"
                  >
                    {post.title}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        post.published
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs text-text-muted">{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-text-muted">
              <p>아직 작성된 글이 없습니다.</p>
              <Link
                href="/admin/blog/new"
                className="mt-1 inline-block text-text-secondary transition-colors hover:text-text"
              >
                새 글 작성 →
              </Link>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="rounded-lg border border-border/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold">게임 인기 순위</h3>
            <Link
              href="/admin/analytics"
              className="text-xs text-text-muted transition-colors hover:text-text-secondary"
            >
              더보기 →
            </Link>
          </div>
          {totalPlays > 0 ? (
            <ChartBar
              data={gameStats.map((g) => ({ label: g.label, value: g.plays }))}
              unit="회"
            />
          ) : (
            <p className="py-4 text-center text-sm text-text-muted">
              아직 게임 플레이 기록이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-surface-hover/50" />
        <div className="h-9 w-20 animate-pulse rounded bg-surface-hover/50" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 p-4 space-y-2"
          >
            <div className="h-4 w-16 animate-pulse rounded bg-surface-hover/50" />
            <div className="h-7 w-12 animate-pulse rounded bg-surface-hover/50" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-28 animate-pulse rounded-lg bg-surface-hover/50"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 p-4 space-y-3"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-surface-hover/50" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="h-5 animate-pulse rounded bg-surface-hover/50"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
