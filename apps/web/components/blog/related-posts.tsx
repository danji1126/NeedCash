import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";

interface RelatedPostsProps {
  currentSlug: string;
}

export function RelatedPosts({ currentSlug }: RelatedPostsProps) {
  const posts = getAllPosts()
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mx-auto h-px max-w-xs bg-border/60" />
      <h2 className="mt-10 font-heading text-xl font-semibold tracking-[-0.01em]">
        다른 글도 읽어보세요
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-lg border border-border/60 p-4 transition-colors hover:bg-bg-secondary"
          >
            <p className="font-heading text-sm font-semibold tracking-[-0.01em]">
              {post.title}
              <span className="ml-1 inline-block text-text-muted transition-transform duration-500 group-hover:translate-x-1">
                &rarr;
              </span>
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-text-secondary">
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
