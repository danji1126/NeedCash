"use client";

import Link from "next/link";
import type { PostMeta } from "@/lib/db";

interface PostFull extends PostMeta {
  id: number;
  content: string;
  html: string;
}

interface PostTableProps {
  posts: PostFull[];
  onDelete: (slug: string) => void;
}

export function PostTable({ posts, onDelete }: PostTableProps) {
  if (posts.length === 0) {
    return <p className="mt-4 text-center text-text-muted">No posts found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border/60 text-text-muted">
          <tr>
            <th className="pb-2 pr-4">Title</th>
            <th className="pb-2 pr-4">Slug</th>
            <th className="pb-2 pr-4">Category</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.slug} className="border-b border-border/30">
              <td className="py-3 pr-4 font-medium">{post.title}</td>
              <td className="py-3 pr-4 text-text-muted">{post.slug}</td>
              <td className="py-3 pr-4 text-text-muted">{post.category}</td>
              <td className="py-3 pr-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    post.published
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="py-3 pr-4 text-text-muted">{post.date}</td>
              <td className="py-3">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/blog/${post.slug}/edit`}
                    className="text-text-secondary hover:text-text"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(post.slug)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
