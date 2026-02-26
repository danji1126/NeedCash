"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/admin/auth-provider";
import { PostForm } from "@/components/admin/post-form";

export default function NewPostPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/admin");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl font-bold">New Post</h2>
      <PostForm mode="create" />
    </div>
  );
}
