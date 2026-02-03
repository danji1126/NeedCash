"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tag } from "@/components/ui/tag";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { PostMeta } from "@/lib/mdx";

interface PostListProps {
  posts: PostMeta[];
}

export function PostList({ posts }: PostListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(posts.map((p) => p.category)));
    return ["All", ...unique.sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (activeTag && !p.tags.includes(activeTag)) return false;
      return true;
    });
  }, [posts, activeCategory, activeTag]);

  const visibleTags = useMemo(() => {
    const source =
      activeCategory === "All"
        ? posts
        : posts.filter((p) => p.category === activeCategory);
    const tagCount = new Map<string, number>();
    source.forEach((p) =>
      p.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)),
    );
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [posts, activeCategory]);

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  };

  return (
    <>
      {/* 카테고리 필터 */}
      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Tag
            key={cat}
            label={cat === "All" ? "All" : `#${cat}`}
            active={activeCategory === cat}
            onClick={() => {
              setActiveCategory(cat);
              setActiveTag(null);
            }}
          />
        ))}
      </div>

      {/* 태그 필터 */}
      {visibleTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`rounded-full px-2.5 py-0.5 text-[12px] transition-all ${
                activeTag === tag
                  ? "bg-text text-bg font-medium"
                  : "bg-bg-secondary text-text-muted hover:text-text"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {filtered.map((post, i) => (
          <ScrollReveal key={post.slug} delay={i * 0.05} className="list-item-offscreen">
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
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTagClick(tag);
                      }}
                      className={`cursor-pointer transition-colors hover:text-text ${
                        activeTag === tag ? "font-medium text-text" : ""
                      }`}
                    >
                      #{tag}
                    </span>
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
            No posts found.
          </p>
        )}
      </div>
    </>
  );
}
