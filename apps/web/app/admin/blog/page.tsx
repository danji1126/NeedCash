"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/admin/auth-provider";
import { PostTable } from "@/components/admin/post-table";
import type { PostMeta } from "@/lib/db";

interface PostFull extends PostMeta {
  id: number;
  content: string;
  html: string;
}

export default function AdminBlogPage() {
  const { isAuthenticated, apiKey, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin");
      return;
    }
  }, [isAuthenticated, router]);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts/admin", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      setPosts(await res.json());
    }
    setLoading(false);
  }, [apiKey]);

  useEffect(() => {
    if (isAuthenticated) fetchPosts();
  }, [isAuthenticated, fetchPosts]);

  async function handleDelete(slug: string) {
    if (!confirm(`"${slug}" 포스트를 삭제하시겠습니까?`)) return;
    await fetch(`/api/posts/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    fetchPosts();
  }

  async function handleTogglePublish(slug: string, published: boolean) {
    await fetch(`/api/posts/${slug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ published }),
    });
    fetchPosts();
  }

  if (!isAuthenticated) return null;

  const filtered = posts.filter((p) => {
    if (filter === "published") return p.published;
    if (filter === "draft") return !p.published;
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">Posts</h2>
        <div className="flex gap-2">
          <Link
            href="/admin/blog/new"
            className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            New Post
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(["all", "published", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 text-sm ${
              filter === f
                ? "bg-text text-bg"
                : "bg-bg-secondary text-text-secondary"
            }`}
          >
            {f === "all" ? "All" : f === "published" ? "Published" : "Draft"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : (
        <PostTable posts={filtered} onDelete={handleDelete} onTogglePublish={handleTogglePublish} />
      )}
    </div>
  );
}
