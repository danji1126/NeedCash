import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
}

export function EditorialPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="pb-24">
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Latest Posts
        </p>
        <div className="mt-3 h-px bg-border/60" />
      </ScrollReveal>

      <div className="mt-0">
        {posts.map((post, i) => (
          <ScrollReveal key={post.slug} delay={i * 0.08}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex items-baseline justify-between border-b border-border/60 py-6 transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] hover:bg-bg-secondary hover:px-4"
            >
              <div className="flex-1">
                <h3 className="font-heading text-base font-semibold tracking-[-0.01em]">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                    {post.description}
                  </p>
                )}
              </div>
              <time className="ml-8 shrink-0 text-[13px] text-text-muted">
                {post.date}
              </time>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
