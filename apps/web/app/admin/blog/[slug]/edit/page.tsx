"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/admin/auth-provider";
import { PostForm } from "@/components/admin/post-form";

interface PostData {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  published: boolean;
  content: string;
}

export default function EditPostPage() {
  const { isAuthenticated, apiKey } = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin");
      return;
    }

    async function fetchPost() {
      const res = await fetch(`/api/posts/${params.slug}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = (await res.json()) as PostData & Record<string, unknown>;
        setPost({
          title: data.title,
          slug: data.slug,
          description: data.description,
          date: data.date,
          category: data.category,
          tags: data.tags,
          published: data.published,
          content: data.content,
        });
      }
      setLoading(false);
    }

    fetchPost();
  }, [isAuthenticated, apiKey, params.slug, router]);

  if (!isAuthenticated) return null;

  if (loading) return <p className="text-text-secondary">Loading...</p>;

  if (!post) return <p className="text-red-500">Post not found.</p>;

  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl font-bold">Edit Post</h2>
      <PostForm mode="edit" initial={post} />
    </div>
  );
}
