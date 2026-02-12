import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
}

export function GlassPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="pb-16">
      <ScrollReveal>
        <div className="rounded-3xl border border-card-border bg-card-bg p-6 backdrop-blur-xl">
          <h2 className="mb-4 font-heading text-lg font-semibold">Latest Posts</h2>
          <div>
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`group flex items-baseline justify-between py-4 transition-all duration-500 hover:pl-2 ${
                  i < posts.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{post.title}</h3>
                  {post.description && (
                    <p className="mt-1 text-xs text-text-secondary line-clamp-1">
                      {post.description}
                    </p>
                  )}
                </div>
                <time className="ml-6 shrink-0 text-[11px] text-text-muted">
                  {post.date}
                </time>
              </Link>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
