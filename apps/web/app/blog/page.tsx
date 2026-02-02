import type { Metadata } from "next";
import { getAllPosts } from "@/lib/mdx";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PostList } from "@/components/blog/post-list";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stories and thoughts on development",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Journal
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
          Blog
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          Stories and thoughts on development.
        </p>
        <div className="mt-6 h-px bg-border/60" />
      </ScrollReveal>

      <PostList posts={posts} />
    </div>
  );
}
