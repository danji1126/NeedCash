"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag } from "@/components/ui/tag";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { PostMeta } from "@/lib/mdx";

const CATEGORIES = ["All", "tech", "design", "life"] as const;

interface PostListProps {
  posts: PostMeta[];
}

export function PostList({ posts }: PostListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Tag
            key={cat}
            label={cat === "All" ? "All" : `#${cat}`}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      <div className="mt-4">
        {filtered.map((post, i) => (
          <ScrollReveal key={post.slug} delay={i * 0.05}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex items-baseline justify-between border-b border-border/60 py-5 transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-bg-secondary hover:px-4"
            >
              <div className="flex-1">
                <h2 className="font-heading text-base font-semibold tracking-[-0.01em]">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                  {post.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[13px] text-text-muted">
                  {post.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="ml-8 shrink-0 text-right">
                <time className="text-[13px] text-text-muted">{post.date}</time>
                <p className="text-[13px] text-text-muted">
                  {post.readingTime} min
                </p>
              </div>
            </Link>
          </ScrollReveal>
        ))}

        {filtered.length === 0 && (
          <p className="py-16 text-center text-text-muted">
            No posts in this category.
          </p>
        )}
      </div>
    </>
  );
}
